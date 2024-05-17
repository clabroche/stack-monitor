/// <reference path="@clabroche/common-typings.d.ts">
const os = require('os');
const { spawn } = require('child_process');
const killport = require('kill-port');
const URL = require('url');
const path = require('path');
const psTree = require('ps-tree');
const PromiseB = require('bluebird');
const dayjs = require('dayjs');
const { v4 } = require('uuid');
const { existsSync, readFileSync } = require('fs-extra');
const pathfs = require('path');
const net = require('net');
const { sockets } = require('@clabroche/common-socket-server');
const { mkdir, writeFile } = require('fs/promises');
const CreateInterface = require('../helpers/readline');
const { stripAnsi, ansiconvert, unescapeAnsi } = require('../helpers/ansiconvert');
const isWindows = require('../helpers/isWindows');
const { execAsync } = require('../helpers/exec');
const { humanStringToKey } = require('../helpers/stringTransformer.helper');

const userInfo = os.userInfo();
const { gid, uid, username } = userInfo;

/** @type {Record<string, {cmd: string, args: string[]}>} */
const alias = {
  ls: { cmd: 'ls', args: ['--color=force'] },
  gco: { cmd: 'git', args: ['checkout'] },
};
const bootstrapConcurrency = {};
class Service {
  /**
   * @param {import('@clabroche/common-typings').NonFunctionProperties<Service>} service
   * @param {import('./stack')} Stack
   */
  constructor(service, Stack) {
    this.Stack = Stack;
    /** @type {string} */
    this.label = service.label || '';
    /** @type {string} */
    this.description = service.description || '';
    /**
     * @type {{
     *  home: string,
     *  remote: string,
     * }}
     * */
    this.git = {
      home: service.git?.home || '',
      remote: service.git?.remote || '',
    };
    /** @type {string} */
    this.documentation = service.documentation || '';
    /** @type {string} */
    this.openapiURL = service.openapiURL || '';
    /** @type {string} */
    this.url = service.url || '';
    /** @type {string[]} */
    this.urls = service.urls || [];
    /** @type {string[]} */
    this.groups = service.groups || [];
    /** @type {boolean} */
    this.enabled = service.enabled || false;
    /** @type {boolean} */
    this.crashed = service.crashed || false;
    /**
     * @type {{
     *  name: string,
     *  build: string[],
     *  volumes: string[],
     *  ignoreVolumes: string[],
     *  sharedVolume: string,
     *  noHostUser: true
     *  noChangeWorkDir: true,
     *  customPid?: ({cmd, args, pid})=> Promise<number | null>
     *  bootstrap: {user: string, cmd: string, entrypoint:string}[] | {concurrencyKey?:string, commands: {user: string, cmd: string, entrypoint:string}[]}
     * } | undefined}
     */
    this.container = service.container || undefined;
    if (this.container) {
      if (!this.container.name) this.container.name = humanStringToKey(this.label);
      if (!this.container.volumes?.length) this.container.volumes = [];
      this.container.sharedVolume = this.container.sharedVolume
        ? pathfs.resolve(this.container.sharedVolume)
        : pathfs.resolve(__dirname, 'temp-docker', this.container.name);
      this.container.ignoreVolumes = this.container.ignoreVolumes?.length
        ? this.container.ignoreVolumes.filter((f) => !f.startsWith(this.container.sharedVolume))
        : [];
    }
    /** @type {boolean} */
    this.exited = service.exited || false;
    /**
     * @type {{
     *  spawnArgs?: string[],
     *  spawnCmd?: string,
     *  spawnOptions?: SpawnOptions
     * }[]}
     * */
    this.commands = service.commands || [];
    /** @type {LogMessage[]} */
    this.store = service.store || [];
    /** @type {import('child_process').ChildProcess[]} */
    this.pids = service.pids || [];
    /** @type {string[]} */
    this.spawnArgs = service.spawnArgs || [];
    /** @type {string} */
    this.spawnCmd = service.spawnCmd || '';
    /** @type {SpawnOptions} */
    this.spawnOptions = {
      cwd: service.spawnOptions?.cwd,
      env: service.spawnOptions?.env,
    };
    /** @type {string} */
    this.rootPath = service.rootPath || service.spawnOptions?.cwd?.toString?.() || service.commands?.[0]?.spawnOptions?.cwd?.toString?.() || '';
    /** @type {Parser[]} */
    this.logParsers = service.logParsers || [];
    /** @type {number | null} */
    this.lastDatePrinted = service.lastDatePrinted || null;
    /** @type {LogMessage[]} */
    this.queue = service.queue || [];
    setInterval(() => {
      if (this.queue.length) {
        const messages = this.queue.splice(0, this.queue.length);
        sockets.io?.emit('logs:update', messages);
      }
    }, 0);
    /**
     * @type {{
     *   check: ((service: Service) => boolean | Promise<boolean>) | undefined,
     *   interval?: number
     * }}
     * */
    this.health = {
      check: service.health?.check,
      interval: service.health?.interval || 1000,
    };

    if ((this.spawnOptions.cwd || this.rootPath)) {
      const customEnvs = this.loadCustomEnv((this.spawnOptions.cwd || this.rootPath).toString());
      this.spawnOptions.overrideEnvs = customEnvs || undefined;
    }
    this.commands.map((command) => {
      if (command?.spawnOptions?.cwd) {
        const customEnvs = this.loadCustomEnv(command.spawnOptions.cwd.toString());
        command.spawnOptions.overrideEnvs = customEnvs || undefined;
      }
      return null;
    });
  }

  /** @param {string} path */
  loadCustomEnv(path) {
    const dotEnvPath = pathfs.resolve(path, '.env');
    if (existsSync(dotEnvPath) && readFileSync(dotEnvPath, { encoding: 'utf-8' }).trim()) {
      console.log(`! A .env will override your ${this.label} service !`);
      return require('dotenv').parse(readFileSync(dotEnvPath));
    }
    return null;
  }

  exportInApi() {
    const res = { ...this };
    // @ts-ignore
    delete res.pids;
    // @ts-ignore
    delete res.store;
    // @ts-ignore
    delete res.Stack;
    return res;
  }

  /** @return {Partial<import('@clabroche/common-typings').NonFunctionProperties<Service>>} */
  exportForDifference() {
    return {
      label: this.label,
      commands: this.commands,
      rootPath: this.rootPath,
      description: this.description,
      git: this.git,
      groups: this.groups,
      spawnArgs: this.spawnArgs,
      spawnCmd: this.spawnCmd,
      spawnOptions: this.spawnOptions,
      url: this.url,
      urls: this.urls,
      container: this.container,
    };
  }

  async restart() {
    if (!this.container && this.tempContainer) this.container = this.tempContainer;
    await this.kill(false);
    await this.launch(false);
    this.Stack.getStack()?.triggerOnServiceRestart(this);
  }

  sendHasBeenModified() {
    sockets.io?.emit('conf:update', [this.label]);
  }

  async kill(triggerEvent = true, keepEnabled = false) {
    if (this.container?.name) {
      await execAsync(`docker stop ${this.container.name}`, {}).catch(console.error);
    } else {
      await PromiseB.map(this.pids, async (spawnedProcess) => {
        if (!spawnedProcess.pid) return;
        const children = await psTreeAsync(spawnedProcess.pid);
        children.map(({ PID }) => process.kill(+PID, 'SIGKILL'));
        spawnedProcess.kill('SIGKILL');
      });
      const urls = [...this.urls || [], this.url].filter((a) => a);
      if (urls.length) {
        await PromiseB.mapSeries(urls, async (url) => {
          const { port } = URL.parse(url);
          if (port && !Number.isNaN(+port)) {
            let free = false;
            for (let i = 0; i < 16; i += 1) {
              // eslint-disable-next-line no-await-in-loop
              await new Promise((resolve) => { setTimeout(resolve, 100); });
              // eslint-disable-next-line no-await-in-loop
              free = await checkport(+port);
              if (free) break;
            }
            if (!free) {
              await killport(+port).catch((err) => console.error('Error: (Kill port):', err?.message || err));
            }
          }
        });
      }
    }
    this.pids = [];
    sockets.io?.emit('logs:clear', { label: this.label });
    this.store = [];
    await new Promise((resolve) => { setTimeout(resolve, 100); });
    this.enabled = keepEnabled;
    this.crashed = false;
    if (triggerEvent) this.Stack.getStack()?.triggerOnServiceKill(this);
    this.sendHasBeenModified();
  }

  async launch(triggerEvent = true) {
    this.store = [];
    await this.kill(false, true).catch(console.error);
    if (this.spawnCmd) {
      await this.launchProcess(
        this.spawnCmd,
        this.spawnArgs || [],
        this.spawnOptions,
      );
    }
    if (this.commands?.length) {
      await PromiseB.map(this.commands, async (command) => {
        if (command?.spawnCmd) {
          await this.launchProcess(
            command?.spawnCmd,
            command?.spawnArgs || [],
            command?.spawnOptions,
          );
        }
      });
    }
    this.enabled = true;
    if (triggerEvent) this.Stack.getStack()?.triggerOnServiceStart(this);
    this.sendHasBeenModified();
  }

  /**
   *
   * @param {Buffer | string} data
   * @param {Partial<LogMessage>} logMessageOverride
   */
  add(data, logMessageOverride, {
    pid, isMainProcess,
  }) {
    const timestamp = Date.now();

    const ansiMsg = unescapeAnsi(data.toString());
    const stripMsg = stripAnsi(ansiMsg);
    const htmlMessage = ansiMsg ? ansiconvert.toHtml(ansiMsg) : '<br/>';
    /** @type {LogMessage} */
    let line = {
      pid,
      msg: htmlMessage,
      raw: stripMsg,
      timestamp,
      label: this.label,
      json: null,
      debug: null,
      ...logMessageOverride,
      id: v4(),
    };

    line = [...(this.Stack.getStack()?.logParsers || []), ...this.logParsers].reduce((line, parser) => {
      if (!parser?.transform) {
        console.error(`It seems your parser "${parser?.id}" has not a transform function. Please verify or disable it..`);
        return line;
      }
      const result = parser.transform(line, this);
      if (!result?.id) {
        console.error(`It seems your parser "${parser.id}" not return correct value. Please verify or disable it..`);
        return line;
      }
      return result;
    }, line);

    if (line.hide) return;

    if (line.source === 'stderr' && isMainProcess) {
      sockets.io?.emit('alert', { label: this.label, message: line.raw.toString(), type: 'error' });
    }

    if (timestamp > (this.lastDatePrinted || Date.now()) + 2000) {
      const date = `🕑  ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`;
      /** @type {LogMessage} */
      const line = {
        id: v4(), raw: date, label: this.label, msg: date, timestamp, isSeparator: true,
      };
      this.store.push(line);
      this.queue.push(line);
    }
    this.lastDatePrinted = Date.now();

    if (line.msg.length > 100000 && !line.msg.startsWith('["stack-monitor"')) line.msg = line.msg.slice(0, 10000);
    this.store.push(line);
    this.queue.push(line);
  }

  /**
   *
   * @param {string} spawnCmd
   * @param {string[]} spawnArgs
   * @param {SpawnOptions} spawnOptions
   */
  async launchProcess(spawnCmd, spawnArgs = [], spawnOptions = {}, isMainProcess = true) {
    this.crashed = false;
    this.exited = false;
    const { cmd, args, options } = await this.parseIncomingCommand(spawnCmd, spawnArgs, spawnOptions, isMainProcess);
    const spawnProcess = spawn(cmd, args, { ...options, detached: !isWindows });

    /** @type {number | undefined | null} */
    let pid = 0;
    pid = spawnProcess.pid;
    if (this.container?.customPid) {
      // cant wait for custom pid, because listeners should be attached fast after spawn call
      this.container.customPid({ pid: spawnProcess.pid, cmd, args })
        .then((_pid) => { pid = _pid; });
    }
    if (!this.pids) this.pids = [];
    this.pids.push(spawnProcess);
    // @ts-ignore
    spawnProcess.title = this.label;
    this.lastDatePrinted = Date.now();
    /** @type {LogMessage[]} */
    this.queue = [];
    new CreateInterface({
      input: spawnProcess.stdout,
      emitAfterNoDataMs: 100,
    })
      .on('line', (message) => {
        this.add(message, { source: 'stdout' }, { isMainProcess, pid });
      });
    new CreateInterface({
      input: spawnProcess.stderr,
      emitAfterNoDataMs: 100,
    }).on('line', (message) => {
      this.add(message, { source: 'stderr' }, { isMainProcess, pid });
    });

    /** @type {LogMessage} */
    const launchMessage = {
      id: v4(),
      timestamp: Date.now(),
      label: this.label,
      pid,
      msg: `${cmd} ${args.join(' ')}`,
      raw: `${cmd} ${args.join(' ')}`,
      cmd: {
        cmd,
        args,
        options,
        status: 'running',
      },
    };
    spawnProcess.on('exit', (code, signal) => {
      if (code) {
        if (launchMessage.cmd) launchMessage.cmd.status = 'error';
        if (isMainProcess) {
          sockets.io?.emit('service:crash', {
            label: this.label, code, signal, pid,
          });
          this.Stack.getStack()?.triggerOnServiceCrash(this, code);
          this.crashed = true;
        }
      } else if (launchMessage.cmd) {
        launchMessage.cmd.status = 'exited';
        if (isMainProcess) {
          this.exited = true;
        }
      }
      sockets.io?.emit('service:exit', {
        label: this.label, code, signal, pid,
      });
      sockets.io?.emit('logs:update:lines', [launchMessage]);
    });

    const date = `🕑  ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`;
    /** @type {LogMessage} */
    const line = {
      id: v4(), raw: date, label: this.label, msg: date, timestamp: this.lastDatePrinted, isSeparator: true,
    };
    this.store.push(line, launchMessage);
    sockets.io?.emit('logs:update', [line, launchMessage]);
    if (isMainProcess) {
      this.launchHealthChecker(spawnProcess);
      sockets.io?.emit('service:start', {
        label: this.label, pid,
      });
    }

    return {
      launchMessage,
      spawnProcess,
    };
  }

  /**
   *
   * @param {import('child_process').ChildProcessWithoutNullStreams} spawnProcess
   */
  async launchHealthChecker(spawnProcess) {
    if ((!spawnProcess.pid && !this.container?.name) || !this.health?.check) return;
    await new Promise((res) => { setTimeout(res, this.health.interval); });
    if (!this.container?.name) {
      if (!(await psTreeAsync(spawnProcess.pid))?.length) {
        this.crashed = true;
        sockets.io?.emit('service:healthcheck:down', { label: this.label, pid: spawnProcess.pid });
        return;
      }
    }
    let healthy;
    try { healthy = await this.health.check(this); } catch (error) {
    }
    if (!healthy && !this.crashed) {
      this.crashed = true;
      sockets.io?.emit('service:healthcheck:down', { label: this.label, pid: spawnProcess.pid });
    } else if (healthy && this.crashed) {
      this.crashed = false;
      sockets.io?.emit('service:healthcheck:up', { label: this.label, pid: spawnProcess.pid });
    }
    this.launchHealthChecker(spawnProcess);
  }

  /**
   *
   * @param {number} pid
   * @param {string} message
   */
  respondToProcess(pid, message) {
    const process = this.pids.find((process) => process.pid === pid);
    if (!process) return console.error(`Pid (${pid}) not found`);
    process.stdin?.write(`${message.trim()}\n`);

    /** @type {LogMessage} */
    const line = {
      id: v4(),
      raw: `${message.trim()}\n`,
      label: this.label,
      msg: `${message.trim()}\n`,
      timestamp: Date.now(),
      prompt: true,
      pid,
    };
    this.store.push(line);
    sockets.io?.emit('logs:update', [line]);
    return null;
  }

  /**
   * @param {number} pid
   * @param {boolean} forceKill
   */
  terminate(pid, forceKill = false) {
    const processFound = this.pids.find((process) => process.pid === pid);
    if (!processFound) return console.error(`Pid (${pid}) not found`);
    if (processFound.pid) {
      if (isWindows) process.kill(processFound.pid, 'SIGKILL');
      else process.kill(-processFound.pid, forceKill ? 'SIGKILL' : 'SIGTERM');
    }
    return null;
  }

  enable() {
    this.enabled = true;
    this.sendHasBeenModified();
  }

  disable() {
    this.enabled = false;
    this.sendHasBeenModified();
  }

  /**
   *
   * @param {string} spawnCmd
   * @param {string[]} spawnArgs
   * @param {SpawnOptions} spawnOptions
   * @param {boolean} isMainProcess
   */
  async parseIncomingCommand(spawnCmd, spawnArgs = [], spawnOptions = {}, isMainProcess = true) {
    let cmd = spawnCmd?.split(' ')?.[0];
    const argFromCmd = spawnCmd?.split(' ')?.slice(1).join(' ');
    let args = [argFromCmd, ...spawnArgs].filter((a) => a);

    const currentAlias = alias[cmd];
    if (currentAlias) {
      cmd = currentAlias?.cmd || cmd;
      args = [...(currentAlias?.args || []), ...args];
    }

    const options = {
      ...spawnOptions,
      cwd: spawnOptions.cwd || this.rootPath,
      shell: isWindows ? process.env.ComSpec : '/bin/sh',
      env: {
        ...(spawnOptions.env || {}),
        ...spawnOptions.overrideEnvs || {},
      },
    };

    if (cmd.match(/[/\\]/g)) {
      cmd = path.resolve(options.cwd.toString(), cmd);
    }
    if (this.container) {
      try {
        const result = await this.buildDocker({
          cmd, args, options, isMainProcess,
        });
        return result;
      } catch (error) {
        console.error(error);
        this.add('We are trying to launch without docker, it might not work', { source: 'stderr' }, { pid: null, isMainProcess });
        this.tempContainer = this.container;
        this.container = undefined;
      }
    }
    options.env = { ...process.env, ...options.env };
    return { cmd, args, options };
  }

  /**
   * @param {{cmd: string, args: string[], options: SpawnOptions, isMainProcess: boolean}} spawnCmd
   */
  async buildDocker({
    cmd, args, options, isMainProcess,
  }) {
    if (!this.container) return { cmd, args, options };
    const internalVolumeRootPath = this.container.sharedVolume;
    const dockerFilePath = pathfs.resolve(internalVolumeRootPath, `Dockerfile.${this.container.name}`);
    const dockerIgnoreFilePath = pathfs.resolve(internalVolumeRootPath, '.dockerignore');
    const dockerContextPath = pathfs.resolve(internalVolumeRootPath, '.empty-context');
    if (!existsSync(internalVolumeRootPath)) await mkdir(internalVolumeRootPath, { recursive: true });
    if (!existsSync(dockerContextPath)) await mkdir(dockerContextPath, { recursive: true });
    await writeFile(dockerFilePath, `
${(this.container.build || []).join('\n')}
${
  this.container.noHostUser
    ? ''
    : `
      RUN echo '${username}:x:${uid}:${gid}::/home/${username}:/usr/bin/sh' >> /etc/passwd
      RUN mkdir -p /home/${username}
      RUN chown ${uid}:${gid} /home/${username}
      USER ${username}
    `
}
${
  this.container.noChangeWorkDir
    ? ''
    : `
      WORKDIR ${options.cwd}
    `
}
${Object.keys(options.env || {}).map((env) => `ENV ${env}=${(options.env || {})[env]} `).join('\n')}
    `.trim(), 'utf-8');
    await writeFile(dockerIgnoreFilePath, 'Dockerfile.*'.trim(), 'utf-8');
    const originalCmd = `${cmd} ${args.join(' ')}`;
    cmd = 'docker';
    const volumesCmd = this.container.volumes.map((v) => (v.includes(':') ? ['-v', `${v}`] : ['-v', `${v}:${v}`]));
    volumesCmd.push(...await PromiseB.map(this.container.ignoreVolumes, async (ignoredVolume) => {
      const volumePath = pathfs.join(internalVolumeRootPath, ignoredVolume);
      if (!existsSync(volumePath)) await mkdir(volumePath, { recursive: true }); // Pre create folders with host uid,gid to prevent docker to create as root user
      if (!existsSync(ignoredVolume)) await mkdir(ignoredVolume, { recursive: true }); // Pre create folders with host uid,gid to prevent docker to create as root user
      return ignoredVolume.startsWith(internalVolumeRootPath) ? [] : ['-v', `${volumePath}:${ignoredVolume}`];
    }).filter((f) => !!f?.length));

    const isAlive = await execAsync(`docker inspect --format {{.State.Pid}}  ${this.container.name}`, {})
      .then((pid) => pid.trim() !== '0')
      .catch(() => false);

    if (!isAlive) {
      this.add('<i class="fab fa-docker" title="docker"></i> <i class="fas fa-hard-hat" title="build"></i> Building docker image...', { source: 'stdout' }, { pid: null, isMainProcess });
      await new Promise((resolve, reject) => {
        const buildProcess = spawn('docker', ['build', '-f', dockerFilePath, '-t', this.container?.name || '', dockerContextPath], { cwd: internalVolumeRootPath, shell: isWindows ? process.env.ComSpec : '/bin/sh' });
        new CreateInterface({
          input: buildProcess.stdout,
        })
          .on('line', (message) => {
            this.add(`<i class="fab fa-docker" title="docker"></i> <i class="fas fa-hard-hat" title="build"></i> ${message}`, { source: 'stdout' }, { isMainProcess, pid: buildProcess.pid });
          });
        new CreateInterface({
          input: buildProcess.stderr,
        }).on('line', (message) => {
          this.add(`<i class="fab fa-docker" title="docker"></i> <i class="fas fa-hard-hat" title="build"></i> ${message}`, { source: 'stdout' }, { isMainProcess, pid: buildProcess.pid });
        });
        buildProcess.on('exit', (code) => {
          if (code) return reject(code);
          return resolve(null);
        });
      });
      const baseArgs = ['run', '--name', this.container.name, '--init', '--rm', '--user', `${uid}:${gid}`, '--network', 'host', ...volumesCmd.flat(1)];
      args = [...baseArgs, this.container.name, originalCmd];
      if (this.container.bootstrap) {
        const bootstrapCommands = (Array.isArray(this.container.bootstrap)
          ? this.container.bootstrap
          : this.container.bootstrap.commands) || [];
        const concurrency = (Array.isArray(this.container.bootstrap)
          ? ''
          : this.container.bootstrap.concurrencyKey);
        if (!concurrency || (concurrency && !bootstrapConcurrency[concurrency])) {
          bootstrapConcurrency[concurrency] = true;
          await PromiseB.mapSeries(bootstrapCommands, async (command) => {
            await new Promise((resolve, reject) => {
              const entrypoint = command.entrypoint ? ['--entrypoint', `${command.entrypoint}`] : [];
              const userEntrypoint = command.user ? ['--user', `${command.user}`] : [];
              const test = [
                ...baseArgs,
                ...entrypoint.flat(1),
                ...userEntrypoint.flat(1),
                this.container.name,
                command.cmd,
              ].filter((a) => a);
              this.add(`<i class="fab fa-docker" title="docker"></i> <i class="fas fa-hourglass-start" title="bootstrap"></i> ${command.entrypoint || ''} ${command.cmd}`, { source: 'stdout' }, { isMainProcess, pid: null });
              const bootstrapProcess = spawn('docker', test, { shell: isWindows ? process.env.ComSpec : '/bin/sh' });
              new CreateInterface({
                input: bootstrapProcess.stdout,
              })
                .on('line', (message) => {
                  this.add(`<i class="fab fa-docker" title="docker"></i> <i class="fas fa-hourglass-start" title="bootstrap"></i> ${command.entrypoint || ''} ${command.cmd} ${message}`, { source: 'stdout' }, { isMainProcess, pid: bootstrapProcess.pid });
                });
              new CreateInterface({
                input: bootstrapProcess.stderr,
              }).on('line', (message) => {
                this.add(`<i class="fab fa-docker" title="docker"></i> <i class="fas fa-hourglass-start" title="bootstrap"></i> ${command.entrypoint || ''} ${command.cmd} ${message}`, { source: 'stderr' }, { isMainProcess, pid: bootstrapProcess.pid });
              });
              bootstrapProcess.on('exit', (code) => {
                if (code) return reject(code);
                return resolve(null);
              });
            });
          }).finally(() => {
            bootstrapConcurrency[concurrency] = false;
          });
        }
      }
    } else {
      await this.add('Attach to container...', { source: 'stdout' }, { pid: null, isMainProcess });
      args = ['exec ', this.container.name, originalCmd];
    }
    this.container.customPid = async () => {
      const getPid = () => execAsync(`docker inspect --format {{.State.Pid}}  ${this.container?.name}`, {}).then((a) => a.trim()).catch(() => null);
      let pid = await getPid();
      if (!pid) {
        await wait(1000);
        pid = await getPid();
      }
      return pid && !Number.isNaN(+pid) ? +pid : null;
    };
    return {
      cmd,
      args,
      options,
    };
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(async () => { resolve(null); }, ms));
/**
 *
 * @param {number} pid
 * @returns {Promise<readonly psTree.PS[]>}
 */
function psTreeAsync(pid) {
  return new Promise((resolve, reject) => {
    psTree(pid, (err, children) => {
      if (err) return reject(err);
      return resolve(children);
    });
  });
}

/** @param {number} _port */
function checkport(_port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => {
      s.close();
      resolve(false);
    });
    s.once('listening', () => {
      resolve(true);
      s.close();
    });
    s.listen(_port);
  });
}

module.exports = Service;

/**
 * @typedef {import('child_process').ExecOptions &
 *  {overrideEnvs?: import('child_process').ExecOptions['env']}
 * } SpawnOptions
 */

/**
 * @typedef {Service} ServiceType
 */
/**
 * @typedef {{
 *  msg: string,
 *  raw: string,
 *  timestamp: number,
 *  prompt?: boolean,
 *  id: string,
 *  source?: 'stdout' | 'stderr'
 *  json?: Record<any, any> | any[] | null,
 *  debug?: Record<any, any> | any[] | null,
 *  isSeparator?: boolean,
 *  label: string,
 *  pid?: number | null,
 *  hide?: boolean,
 *  cmd?: {cmd: string, args: string[], options: import('child_process').ExecOptions, status: 'running' | 'error' | 'exited'},
 * }} LogMessage
 */

/**
 * @typedef {{
 *  id: string,
 *  transform: ((msg: LogMessage, service?: Service | null) => LogMessage)
 * }} Parser
 */
