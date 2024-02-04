process.env.PREFERRED_WORKSPACE_MANAGER = 'yarn';
const { watch } = require('chokidar');
const { getPackageInfos } = require('workspace-tools');
const pathfs = require('path');
const { spawn } = require('node:child_process');
const debounce = require('debounce');
const killport = require('kill-port');
const net = require('net');

const command = {
  cmd: process.argv[2],
  args: process.argv.slice(3),
};

const ignored = ['**/*node_modules', '**/*dist', '**/*.git', '**/*.yarn'];
let restartInProgress = false;
let pid;
let waitingRestart;

(async () => {
  const watchableDeps = getWatchableDeps(pathfs.resolve('.'));
  console.log('<h1 style="padding: 0;margin: 0">Listening these deps</h1><ul style="margin: 0">', watchableDeps.map((a) => `<li>${a.name}</li>`).join(''), '</ul>');
  mainProcessDaemon();
  await runMainProcess();
  watchDeps(watchableDeps, (packageInfo) => {
    console.log('Changed occured', packageInfo.name);
    runMainProcess();
    return packageInfo;
  });
})();

function mainProcessDaemon() {
  setInterval(() => {
    if (!restartInProgress) {
      if (waitingRestart) {
        const toRun = waitingRestart;
        waitingRestart = null;
        toRun();
      }
    }
  }, 0);
}
async function runMainProcess() {
  if (restartInProgress) {
    waitingRestart = () => runMainProcess();
    return pid;
  }
  restartInProgress = true;
  if (pid) {
    try { process.kill(pid, 'SIGKILL'); } catch (error) {}
  }
  const port = +(process.env.PORT || '');
  if (port && !Number.isNaN(port)) {
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    const free = await checkport(port);
    if (!free) {
      await killport(+port).catch((err) => console.error('Error: (Kill port):', err?.message || err));
    }
  }
  console.log(' ');
  console.log(`<h3 style="padding: 0;margin: 0">Command: ${command.cmd} ${command.args.join(' ')}</h3>`);
  const spawned = spawn(command.cmd, command.args, { cwd: pathfs.resolve('.') });
  pid = spawned.pid;
  spawned.stdout.on('data', (data) => {
    console.log(data.toString('utf-8'));
  });
  spawned.stderr.on('data', (data) => {
    console.error(data.toString('utf-8'));
  });
  restartInProgress = false;
  return spawned.pid;
}

function watchDeps(watchableDeps, cb = (
  /** @type {import('workspace-tools').PackageInfos[number]} */packageInfo,
) => packageInfo) {
  const call = debounce((packageInfo) => cb(packageInfo), 100);
  watch(__dirname, { ignored, ignoreInitial: true }).on('all', (event, path) => {
    const packageInfos = getPackageInfos('.');
    const packageChanged = Object.keys(packageInfos)
      .filter((f) => {
        if (!watchableDeps.find((w) => w.name === f)) return false;
        const changedPath = path.replace(`${__dirname}/`, '').replaceAll('/', '-');
        const packageName = f.replace('@clabroche/', '');
        return changedPath.startsWith(packageName);
      }).pop();
    if (packageChanged) {
      call(packageInfos[packageChanged]);
    }
  }).on('ready', () => console.log('ready'));
}

function getWatchableDeps(path) {
  const currentPackage = getPackageInfoFromPath(path);
  if (currentPackage) {
    const depsName = getDependencies(currentPackage?.name);
    /** @type {import('workspace-tools').PackageInfos[number][]} */
    const deps = depsName.map((depName) => getPackageInfos('.')[depName]);
    // if(currentPackage.scripts?.watch)deps.push(currentPackage);
    return deps;
  }
  return [];
}

function getDependencies(packageName, recursiveAggr = []) {
  const dependencies = (getPackageInfos(__dirname)[packageName].dependencies || {});
  const devDependencies = (getPackageInfos(__dirname)[packageName].devDependencies || {});
  const deps = [
    ...Object.keys(dependencies),
    ...Object.keys(devDependencies),
  ].filter((f) => f.startsWith('@clabroche') && (dependencies[f] === 'workspace:*' || devDependencies[f] === 'workspace:*'));
  deps.forEach((f) => {
    if (!recursiveAggr.includes(f)) {
      recursiveAggr.push(f);
      deps.map((dep) => getDependencies(dep, recursiveAggr)).flat();
    }
  });
  return recursiveAggr;
}

function getPackageInfoFromPath(path) {
  const packagesInfos = getPackageInfos(__dirname);
  return Object.values(packagesInfos)
    .filter((f) => (
      path.replace(`${__dirname}/`, '')
        .replaceAll('/', '-')
        .startsWith(
          f.name.replace('@clabroche/', ''),
        )
    )).pop();
}

function checkport(_port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => {
      s.close();
      resolve(false);
    });
    s.once('listening', () => {
      console.log(_port);
      resolve(true);
      s.close();
    });
    s.listen(_port);
  });
}
