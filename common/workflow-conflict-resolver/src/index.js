/** @type {import('execa')} */
const { execa } = require('fix-esm').require('execa');
const PromiseB = require('bluebird');
const { readFile, writeFile } = require('fs-extra');
const pathfs = require('path');
const semver = require('semver');

const rootMonorepoPath = pathfs.resolve(__dirname, '..', '..', '..');

(async () => {
  const unmergedFiles = await getUnmergedFiles();
  if (unmergedFiles?.length) {
    console.log('Conflict in progress');
    await resolveConflict(unmergedFiles);
    await execa('git', ['add', ...unmergedFiles.map((path) => pathfs.resolve(rootMonorepoPath, path))], { cwd: rootMonorepoPath });
    await execa('git', ['commit', '-m', '[Automated] Resolve conflict'], { cwd: rootMonorepoPath, env: { HUSKY: '0' } });
  } else {
    const [sourceBranch, targetBranch] = process.argv.slice(2);
    console.log(`See for conflicts: ${sourceBranch} => ${targetBranch}`);
    await execa('git', ['reset', '--hard'], { cwd: rootMonorepoPath, env: { HUSKY: '0' } });
    await execa('git', ['merge', 'master', '-m', '[Automated] Merge conflicts'], { cwd: rootMonorepoPath, env: { HUSKY: '0' } })
      .catch(() => {});
    const config = await resolveConflict(await getUnmergedFiles());

    if (config?.length) {
      await execa('git', ['add', ...config.map((c) => c.path)], { cwd: rootMonorepoPath });
      await execa('git', ['commit', '-m', '[Automated] Resolve conflict'], { cwd: rootMonorepoPath, env: { HUSKY: '0' } });
      await execa('git', ['push'], { cwd: rootMonorepoPath });
    } else {
      console.log('No conflicts to resolve');
    }
  }
})().catch(console.error);

async function getUnmergedFiles() {
  const { stdout: filesString } = await execa('git', ['diff', '--name-only', '--diff-filter=U', '--relative'], { cwd: rootMonorepoPath });
  return filesString.split('\n').filter((p) => p);
}

/**
 * @param {string[]} filesPath
 */
async function resolveConflict(filesPath) {
  const config = /** @type {ConfigResolution[]} */(await PromiseB.mapSeries(filesPath, async (filePath) => {
    const baseName = pathfs.basename(filePath);
    const supportedFile = ['CHANGELOG.md', 'package.json', 'lerna.json'].includes(baseName);
    if (!supportedFile) {
      throw new Error(`${filePath} is not supported for conflict resolution`);
    }
    const path = pathfs.resolve(rootMonorepoPath, filePath);
    const file = await readFile(path, { encoding: 'utf-8' });
    console.log('\n', '-----------------------');
    console.log('Conflict in:', filePath);
    const [, all, actual, incoming] = file.match(/(<{7}.*([\s\S]*)={7}.*([\s\S]*)>{7}.*)/) || [];
    console.log(actual?.split('\n').map((line) => `<<<<<<< ${line}`).join('\n'));
    console.log();
    console.log(incoming?.split('\n').map((line) => `>>>>>>> ${line}`).join('\n'));
    if (!actual && !incoming) {
      return null;
    }
    if (actual.includes('<<<<<<<') || incoming.includes('<<<<<<<')) {
      throw new Error(`${filePath} File has multiple conflicts`);
    }
    if (['lerna.json', 'package.json'].includes(baseName)) {
      const actualVersion = actual.trim().replace('"version": "', '').replaceAll(',', '').replaceAll('"', '')
        .trim();
      const incomingVersion = incoming.trim().replace('"version": "', '').replaceAll(',', '').replaceAll('"', '')
        .trim();
      if (!semver.valid(actualVersion) || !semver.valid(incomingVersion)) {
        console.log(actualVersion, incomingVersion, incoming);
        throw new Error('It seems that conflict is not for versions');
      }
      return {
        path,
        all,
        actual,
        incoming,
        /** @type {ConfigResolution['resolution']} */
        resolution: semver.gt(actualVersion, incomingVersion) ? 'actual' : 'incoming',
        content: file,
      };
    }
    if (['CHANGELOG.md'].includes(baseName)) {
      return {
        path,
        all,
        actual,
        incoming,
        /** @type {ConfigResolution['resolution']} */
        resolution: 'both',
        content: file,
      };
    }
    throw new Error('This conflict cannot be automatically resolve');
  }).filter((f) => !!f));

  await PromiseB.mapSeries(config, async (conf) => {
    if (conf.resolution === 'actual') {
      await execa('git', ['checkout', '--ours', conf.path], { cwd: rootMonorepoPath });
    } else if (conf.resolution === 'incoming') {
      await execa('git', ['checkout', '--theirs', conf.path], { cwd: rootMonorepoPath });
    } else if (conf.resolution === 'both') {
      conf.content = conf.content.replace(conf.all, `${conf.actual}\n\n${conf.incoming}`);
      await writeFile(conf.path, conf.content, { encoding: 'utf-8' });
    }
  });
  return config;
}
/**
 * @typedef {{
 *  path: string,
 *  actual: string,
 *  incoming: string,
 *  all: string,
 *  resolution: 'actual' | 'incoming' | 'both',
 *  content: string,
 * }}ConfigResolution
 */
