/* eslint-disable func-names */
/// <reference path="@clabroche/common-typings.d.ts">
const os = require('os');
const { spawn } = require('child_process');
const killport = require('kill-port');
const URL = require('url');
const path = require('path');
const PromiseB = require('bluebird');
const dayjs = require('dayjs');
const { v4 } = require('uuid');
const { existsSync, readFileSync } = require('fs');
const kill = require('tree-kill');
const axios = require('axios').default;
const pathfs = require('path');
const net = require('net');
// eslint-disable-next-line import/no-extraneous-dependencies
const { sockets } = require('@clabroche/common-socket-server');
const { mkdir, writeFile } = require('fs/promises');
const { cloneDeep } = require('lodash');
const CreateInterface = require('../helpers/readline');
const { stripAnsi, ansiconvert, unescapeAnsi } = require('../helpers/ansiconvert');
const isWindows = require('../helpers/isWindows');
const { execAsync } = require('../helpers/exec');
const { humanStringToKey, replaceEnvs } = require('../helpers/stringTransformer.helper');
const dbs = require('../helpers/dbs');
const Environment = require('./Environment');
const ParserModel = require('./Parser');

const userInfo = os.userInfo();
const { gid, uid, username } = userInfo;

/** @type {Record<string, {cmd: string, args: string[]}>} */
const alias = {
  ls: { cmd: 'ls', args: ['--color=force'] },
  gco: { cmd: 'git', args: ['checkout'] },
};
const bootstrapConcurrency = {};

/**
 * @param {import('@clabroche/common-typings').NonFunctionProperties<Service>} service
 * @param {import('./stack')} Stack
 */
function Service(service, Stack, { isUpdate } = { isUpdate: false }) {
  return (async () => {
    this.Stack = Stack;
    /** @type {LogMessage[]} */
    this.queue = service.queue || [];
    this.stopQueue = false
    if (!isUpdate) {
      this.processQueue()
    }
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
    /** @type {string} */
    this.rootPath = service.rootPath || service.commands?.[0]?.spawnOptions?.cwd?.toString() || '.';
    /** @type {string[]} */
    this.urls = service.urls || [];
    /** @type {string[]} */
    this.groups = service.groups || [];
    /** @type {string[]} */
    this.parsers = service.parsers || [];
    /** @type {boolean} */
    this.enabled = service.enabled || false;
    /** @type {boolean} */
    this.crashed = service.crashed || false;
    /**
     * @type {{
     *  enabled: boolean
     *  name: string,
     *  user?: string,
     *  build: string,
     *  volumes: string[],
     *  ignoreVolumes: string[],
     *  sharedVolume: string,
     *  noHostUser: true
     *  noChangeWorkDir: true,
     *  customPid?: ({cmd, args, pid})=> Promise<number | null>
     *  bootstrap: {commands: Array<{concurrencyKey?:string, commands: {user: string, cmd: string, entrypoint:string}}>}
     * }}
     */
    // @ts-ignore
    this.container = service.container || {};
    if (this.container) {
      if (!this.container.name) this.container.name = humanStringToKey(this.label);
      if (!this.container.volumes?.length) this.container.volumes = [];
      if (!this.container.build) this.container.build = '';
      this.container.sharedVolume = this.container.sharedVolume || '~/.stack-monitor';
      this.container.ignoreVolumes = this.container.ignoreVolumes?.length
        ? this.container.ignoreVolumes.filter((f) => !f.startsWith(this.container?.sharedVolume || ''))
        : [];
      if (!this.container.bootstrap) this.container.bootstrap = { commands: [] };
      if (!this.container.bootstrap.commands) this.container.bootstrap.commands = [];
    }
    /** @type {boolean} */
    this.exited = service.exited || false;
    /**
     * @type {{
     *  id: string,
     *  spawnArgs: string[],
     *  spawnCmd: string,
     *  spawnOptions: SpawnOptions & {envs: {[key:string]: {extends: [], envs: {key: string, value: string, override: string, systemOverride?: string, prefix?: string, suffix?: string}[]}}}
     *  effectiveParsers: ParserModel[]
     *  parsers: string[]
     * }[]}
     * */
    this.commands = service.commands || [];
    /** @type {LogMessage[]} */
    this.store = service.store || [];
    /** @type {import('child_process').ChildProcess[]} */
    this.pids = service.pids || [];
    /** @type {number | null} */
    this.lastDatePrinted = service.lastDatePrinted || null;

    /**
     * @type {{
     *  enabled: boolean,
     *  url: string,
     *  interval: string,
     *  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
     *  returnCode: number,
     *  responseText: string,
     *  timeout: number,
     *  startAfter: number
     * }}
     * */
    this.health = service.health || {
      enabled: false,
      url: '',
      interval: '',
      method: 'GET',
      returnCode: 200,
      responseText: '',
      timeout: 0,
      startAfter: 0,
    };
    const environments = await Environment.all();
    const overrides = await dbs.getDb(`overrides/${this.label}-envs`).read();

    // Load variables from db and envs
    if (!isUpdate) {
      this.commands.forEach((command) => {
        // Load .env
        if (!command.spawnOptions?.cwd) command.spawnOptions.cwd = '';
        const customEnvs = this.loadCustomEnv(command.spawnOptions.cwd.toString()) || {};
        Object.keys(customEnvs).forEach((key) => {
          if (!command.spawnOptions?.envs) return;
          const value = customEnvs[key];
          environments.forEach((environment) => {
            if (!command.spawnOptions.envs[environment.label]) {
              command.spawnOptions.envs[environment.label] = { extends: [], envs: [] };
            }
            const existingEnv = command.spawnOptions.envs[environment.label].envs.find((env) => env.key === key);
            if (existingEnv) {
              existingEnv.systemOverride = value;
            } else {
              command.spawnOptions.envs[environment.label].envs.push({
                key, value: '', override: '', systemOverride: value,
              });
            }
          });
        });
        // Load overrides
        environments.forEach((environment) => {
          command.spawnOptions.envs?.[environment.label]?.envs.forEach((env) => {
            const override = overrides?.[command.id]?.[environment.label]?.[env.key];
            if (override) {
              env.override = override;
            }
          });
        });
      });
    }
    /** @type {Record<string, string>} */
    this.meta = service.meta || {};
    await PromiseB.map(this.commands || [], async (command) => {
      // @ts-ignore
      command.effectiveParsers = await PromiseB.map([
        ...(this.parsers || []),
        ...(command.parsers || []),
      ], (parserId) => ParserModel.find(parserId)).filter((a) => !!a);
    });
    return this;
  })();
}
Service.prototype.getRootPath = function () {
  return replaceEnvs(this.rootPath);
};

Service.prototype.processQueue = function() {
  if (this.queue.length) {
    const messages = this.queue.splice(0, this.queue.length);
    sockets.emit('logs:update', messages);
  }
  if(this.stopQueue) return
  setTimeout(() => {this.processQueue()}, 100);
}

Service.prototype.save = async function () {
  const obj = this.toStorage();
  const overrides = {};
  await PromiseB.map((obj.commands || []), async (command) => {
    if (!overrides[command.id]) overrides[command.id] = {};
    await PromiseB.map(Object.keys(command.spawnOptions.envs), (environmentLabel) => {
      if (!overrides[command.id][environmentLabel]) overrides[command.id][environmentLabel] = {};
      command.spawnOptions.envs[environmentLabel].envs.forEach((env) => {
        overrides[command.id][environmentLabel][env.key] = env.override;
        delete env.systemOverride;
        // @ts-ignore
        delete env.override;
      });
    });
    delete command.spawnOptions?.overrideEnvs;
  });
  await dbs.getDb(`overrides/${this.label}-envs`).write(overrides);
  await dbs.getDb(`services/${this.label}`).write(obj);
};

Service.prototype.delete = async function () {
  await dbs.getDb(`overrides/${this.label}-envs`).delete();
  await dbs.getDb(`services/${this.label}`).delete();
};

Service.load = async function (label, Stack) {
  return new Service(await dbs.getDb(`services/${label}`).read(), Stack);
};

/** @param {string} path */
Service.prototype.loadCustomEnv = function (path) {
  const dotEnvPath = pathfs.resolve(path, '.env');
  if (existsSync(dotEnvPath) && readFileSync(dotEnvPath, { encoding: 'utf-8' }).trim()) {
    console.log(`! A .env will override your ${this.label} service !`);
    return require('dotenv').parse(readFileSync(dotEnvPath, 'utf-8'));
  }
  return null;
};

Service.prototype.exportInApi = function () {
  const res = { ...this };
  // @ts-ignore
  delete res.pids;
  // @ts-ignore
  delete res.store;
  // @ts-ignore
  delete res.Stack;
  return res;
};
/** @return {Partial<import('@clabroche/common-typings').NonFunctionProperties<Service>>} */
Service.prototype.toStorage = function () {
  const service = cloneDeep({
    label: this.label,
    commands: this.commands,
    description: this.description,
    git: this.git,
    groups: this.groups,
    url: this.url,
    rootPath: this.rootPath,
    openapiURL: this.openapiURL,
    health: this.health,
    urls: this.urls,
    parsers: this.parsers,
    container: this.container,
    meta: this.meta,
  });
  if (service.commands) {
    service.commands.map((command) => {
      if (!command.spawnOptions.envs[this.Stack.getCurrentEnvironment()?.label || '']) command.spawnOptions.envs[this.Stack.getCurrentEnvironment()?.label || ''] = { extends: [], envs: [] };
      command.spawnOptions.envs[this.Stack.getCurrentEnvironment()?.label || ''].envs = command.spawnOptions?.envs[this.Stack.getCurrentEnvironment()?.label || ''].envs.map((env) => ({
        key: env.key,
        value: env.value,
        prefix: env.prefix,
        suffix: env.suffix,
        override: env.override,
      }));
      return command;
    });
  }
  return service;
};

Service.prototype.restart = async function () {
  await this.kill();
  await this.launch();
};

Service.prototype.sendHasBeenModified = function () {
  sockets.emit('conf:update', [this.label]);
};

Service.prototype.kill = async function (keepEnabled = false) {
  if (this.container?.enabled && this.container?.name) {
    await execAsync(`docker stop ${this.container.name}`, {}).catch(console.error);
  } else {
    await PromiseB.map(this.pids, async (spawnedProcess) => {
      if (!spawnedProcess.pid) return;
      await killAsync(spawnedProcess.pid);
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
            await wait(100);
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
  sockets.emit('logs:clear', { label: this.label });
  this.store = [];
  await wait(100);
  this.enabled = keepEnabled;
  this.crashed = false;
  this.sendHasBeenModified();
};

Service.prototype.launch = async function () {
  this.store = [];
  await this.kill(true).catch(console.error);
  if (this.commands?.length) {
    await PromiseB.map(this.commands, async (command) => {
      if (command?.spawnCmd) {
        await this.launchProcess(command);
      }
    });
  }
  this.enabled = true;
  this.sendHasBeenModified();
};

/**
 * @param {Buffer | string} data
 * @param {Partial<LogMessage>} logMessageOverride
 */
Service.prototype.add = async function (data, logMessageOverride, {
  pid, isMainProcess, command,
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
  line = await PromiseB.reduce(command.effectiveParsers || [], async (line, parser) => {
    try {
      const result = await parser.transformFunction(line, this);
      if (!result?.id) {
        console.error(`It seems your parser "${parser.label}" not return correct value. Please verify or disable it..`);
        return line;
      }
      return result;
    } catch (err) {
      console.error('[PARSER]:', parser.label, ':', err);
      return line;
    }
  }, line);

  if (line.hide) return;

  if (line.source === 'stderr' && isMainProcess) {
    sockets.emit('alert', { label: this.label, message: line.raw.toString(), type: 'error' });
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
};

Service.prototype.launchProcess = async function (command, isMainProcess = true) {
  try {
    this.crashed = false;
    this.exited = false;
    const { cmd, args, options } = await this.parseIncomingCommand(command, isMainProcess);
    if (!existsSync(options.cwd)) {
      this.crashed = true;
      this.exited = true;
      /** @type {LogMessage} */
      const launchMessage = {
        id: v4(),
        timestamp: Date.now(),
        label: this.label,
        pid: null,
        msg: `Path does not exists (${options.cwd})`,
        raw: `Path does not exists (${options.cwd})`,
        cmd: {
          cmd,
          args,
          options,
          status: 'exited',
        },
      };
      console.error(launchMessage.msg);
      this.add(launchMessage.msg, { source: 'stderr' }, { pid: null, command, isMainProcess });
      return undefined;
    }
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
        this.add(message, { source: 'stdout' }, { isMainProcess, pid, command });
      });
    new CreateInterface({
      input: spawnProcess.stderr,
      emitAfterNoDataMs: 100,
    }).on('line', (message) => {
      this.add(message, { source: 'stderr' }, { isMainProcess, pid, command });
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
          sockets.emit('service:crash', {
            label: this.label, code, signal, pid,
          });
          this.crashed = true;
        }
      } else if (launchMessage.cmd) {
        launchMessage.cmd.status = 'exited';
        if (isMainProcess) {
          this.exited = true;
        }
      }
      sockets.emit('service:exit', {
        label: this.label, code, signal, pid,
      });
      sockets.emit('logs:update:lines', [launchMessage]);
    });

    const date = `🕑  ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`;
    /** @type {LogMessage} */
    const line = {
      id: v4(), raw: date, label: this.label, msg: date, timestamp: this.lastDatePrinted, isSeparator: true,
    };
    this.store.push(line, launchMessage);
    sockets.emit('logs:update', [line, launchMessage]);
    if (isMainProcess) {
      setTimeout(() => {
        this.launchHealthChecker(spawnProcess);
      }, this.health.startAfter || 0);
      sockets.emit('service:start', {
        label: this.label, pid,
      });
    }

    return {
      launchMessage,
      spawnProcess,
    };
  } catch (error) {
    /** @type {LogMessage} */
    const launchMessage = {
      id: v4(),
      timestamp: Date.now(),
      label: this.label,
      pid: null,
      msg: `ERROR: ${error?.message || error}`,
      raw: `ERROR: ${error?.message || error}`,
      cmd: {
        cmd: command.spawnCmd,
        args: command.spawnArgs,
        options: command.spawnOptions,
        status: 'exited',
      },
    };
    const date = `🕑  ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`;
    const line = {
      id: v4(), raw: date, label: this.label, msg: date, timestamp: this.lastDatePrinted, isSeparator: true,
    };
    sockets.emit('logs:update', [line, launchMessage]);
    throw error;
  }
};

/**
   *
   * @param {import('child_process').ChildProcessWithoutNullStreams} spawnProcess
   */
Service.prototype.launchHealthChecker = async function (spawnProcess) {
  if ((!spawnProcess.pid && !this.container?.name) || !this.health?.enabled) return;
  const healthy = await axios({
    method: this.health.method || 'GET',
    url: this.health.url || this.url,
    headers: {Accept: '*/*'},
    timeout: +(this.health.timeout || 0),
    validateStatus: (status) => status === (+(this.health.returnCode || 200)),
  })
    .then(({ data: response }) => {
      if (this.health.responseText && this.health.responseText !== JSON.stringify(response)) {
        return false;
      }
      return true;
    })
    .catch(() => false);
  if (!healthy && !this.crashed) {
    this.crashed = true;
    sockets.emit('service:healthcheck:down', { label: this.label, pid: spawnProcess.pid });
  } else if (healthy && this.crashed) {
    this.crashed = false;
    sockets.emit('service:healthcheck:up', { label: this.label, pid: spawnProcess.pid });
  }
  await wait(+(this.health.interval || 1000));
  this.launchHealthChecker(spawnProcess);
};

/**
   *
   * @param {number} pid
   * @param {string} message
   */
Service.prototype.respondToProcess = function (pid, message) {
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
  sockets.emit('logs:update', [line]);
  return null;
};

/**
   * @param {number} pid
   * @param {boolean} forceKill
   */
Service.prototype.terminate = function (pid, forceKill = false) {
  const processFound = this.pids.find((process) => process.pid === pid);
  if (!processFound) return console.error(`Pid (${pid}) not found`);
  if (processFound.pid) {
    if (isWindows) process.kill(processFound.pid, 'SIGKILL');
    else process.kill(-processFound.pid, forceKill ? 'SIGKILL' : 'SIGTERM');
  }
  return null;
};

Service.prototype.enable = function () {
  this.enabled = true;
  this.sendHasBeenModified();
};

Service.prototype.disable = function () {
  this.enabled = false;
  this.sendHasBeenModified();
};

Service.prototype.getGlobalEnvs = async function (environmentLabel) {
  const globalEnvironment = await Environment.find(environmentLabel);
  return (label) => {
    const tag = this.extractTag(label);
    if (tag) {
      return globalEnvironment?.envs[tag] ?? '';
    }
    return label;
  };
};

Service.prototype.buildEnvs = async function (
  environmentLabel,
  spawnOptions,
) {
  const globalEnvironment = await Environment.find(environmentLabel)
  if(!globalEnvironment) return {}
  const extendedEnvironments = await globalEnvironment.getExtendedEnvironments()
  const environmentsKeys = new Map()
  const searchEnv = (label, env) => {
    const tag = this.extractTag(label);
    if (tag) {
      return env[tag] ?? '';
    }
    return label;
  };
  extendedEnvironments.map(extendedEnvironment => {
    spawnOptions.envs[extendedEnvironment.label]?.envs.forEach(env => {
      if(!environmentsKeys.has(env.key)) {
        for (let i = 0; i < extendedEnvironments.length; i++) {
          let occurrence = searchEnv(env.systemOverride, extendedEnvironments[i].envs) || searchEnv(env.override, extendedEnvironments[i].envs) || searchEnv(env.value, extendedEnvironments[i].envs)
          if (occurrence) occurrence = `${env.prefix || ''}${occurrence || ''}${env.suffix || ''}`
          const value = occurrence
          if(value) {
            environmentsKeys.set(env.key, value)
            return 
          }
        }
      }
    });
  });
  const envs ={}
  ;[...environmentsKeys].forEach(([key, value]) => {
    envs[key] = value
  })
  // console.log(globalEnvironment?.getExtendedEnvironments())
  // const environment = spawnOptions.envs[environmentLabel];
  // if (!environment) return [];
  // const searchEnv = await this.getGlobalEnvs(environmentLabel);
  
  // const computedEnvs = environment.envs.reduce((envs, env) => {
  //   let occurrence = searchEnv(env.systemOverride) || searchEnv(env.override) || searchEnv(env.value)
  //   if (occurrence) occurrence = `${env.prefix || ''}${occurrence || ''}${env.suffix || ''}`
  //   envs[env.key] = occurrence || envs[env.key];
  //   return envs;
  // }, envs);
  return envs;
};

Service.prototype.extractTag = function (field) {
  const extractedTag = /{{(.*)}}/gi.exec(field)?.[1]?.trim();
  return extractedTag;
};

/**
   * @param {boolean} isMainProcess
   */
Service.prototype.parseIncomingCommand = async function (command, isMainProcess = true) {
  const { spawnCmd, spawnArgs = [], spawnOptions = { envs: [] } } = command;
  let cmd = spawnCmd?.split(' ')?.[0];
  const argFromCmd = spawnCmd?.split(' ')?.slice(1).join(' ');
  let args = [argFromCmd, ...spawnArgs].filter((a) => a);

  const currentAlias = alias[cmd];
  if (currentAlias) {
    cmd = currentAlias?.cmd || cmd;
    args = [...(currentAlias?.args || []), ...args];
  }
  const cwd = replaceEnvs(pathfs.resolve(spawnOptions.cwd || this.commands[0]?.spawnOptions?.cwd || this.getRootPath() || '.'));
  const options = {
    ...spawnOptions,
    cwd,
    shell: isWindows ? process.env.ComSpec : '/bin/sh',
    env: await this.buildEnvs(this.Stack.getCurrentEnvironment()?.label, spawnOptions),
  };

  if (cmd.match(/[/\\]/g)) {
    cmd = path.resolve(options.cwd.toString(), cmd);
  }
  if (this.container?.enabled) {
    const result = await this.buildDocker({
      cmd, args, options, isMainProcess,
    });
    return result;
  }
  options.env = { ...process.env, ...options.env };
  return { cmd, args, options };
};

function replaceHome(str) {
  return str.startsWith('~')
    ? pathfs.resolve(os.homedir(), str.replace('~/', ''))
    : pathfs.resolve(str);
}
/**
   * @param {{cmd: string, args: string[], options: SpawnOptions, isMainProcess: boolean}} spawnCmd
   */
Service.prototype.buildDocker = async function ({
  cmd, args, options, isMainProcess,
}) {
  if (!this.container?.enabled) return { cmd, args, options };
  const internalVolumeRootPath = replaceHome(this.container.sharedVolume)
  const dockerFilePath = pathfs.resolve(internalVolumeRootPath, `Dockerfile.${this.container.name}`);
  const dockerIgnoreFilePath = pathfs.resolve(internalVolumeRootPath, '.dockerignore');
  const dockerContextPath = pathfs.resolve(internalVolumeRootPath, '.empty-context');
  if (!existsSync(internalVolumeRootPath)) await mkdir(internalVolumeRootPath, { recursive: true });
  if (!existsSync(dockerContextPath)) await mkdir(dockerContextPath, { recursive: true });
  await writeFile(dockerFilePath, `
${this.container.build || ''}
${Object.keys(options.env || {}).map((env) => `ENV ${env}=${(options.env || {})[env]} `).join('\n')}
    `.trim(), 'utf-8');
  await writeFile(dockerIgnoreFilePath, 'Dockerfile.*'.trim(), 'utf-8');
  const originalCmd = `${cmd} ${args.join(' ')}`;
  cmd = 'docker';
  const volumesCmd = this.container.volumes.map((v) => {
    let [external, internal] = v.split(':');
    if (external) external = pathfs.resolve(replaceHome(replaceEnvs(external)));
    if (internal) internal = pathfs.resolve(replaceHome(replaceEnvs(internal)));
    console.log(external,internal)
    return ['-v', `"${external}:${internal || external}"`];
  });
  volumesCmd.push(...await PromiseB.map(this.container.ignoreVolumes, async (ignoredVolume) => {
    const volumePath = pathfs.join(internalVolumeRootPath, `ignored-volume-${humanStringToKey(this.label)}`, ignoredVolume);
    if (!existsSync(volumePath)) await mkdir(volumePath, { recursive: true }); // Pre create folders with host uid,gid to prevent docker to create as root user
    return ['-v', `"${volumePath}:${ignoredVolume}"`];
  }).filter((f) => !!f?.length));

  const isAlive = await execAsync(`docker inspect --format {{.State.Pid}}  ${this.container.name}`, {})
    .then((pid) => pid.trim() !== '0')
    .catch(() => false);

  if (!isAlive) {
    const command = {
      spwanCmd: 'docker',
      spawnArgs: ['build', '-f', dockerFilePath, '-t', this.container?.name || '', dockerContextPath],
      spawnOptions: { cwd: internalVolumeRootPath, shell: isWindows ? process.env.ComSpec : '/bin/sh' },
    };
    this.add('<i class="fab fa-docker" title="docker"></i> <i class="fas fa-hard-hat" title="build"></i> Building docker image...', { source: 'stdout' }, { pid: null, isMainProcess, command });
    this.add(`<i class="fab fa-docker" title="docker"></i> <i class="fas fa-hard-hat" title="build"></i> ${command.spwanCmd} ${command.spawnArgs?.join(' ')}}`, { source: 'stdout' }, { pid: null, isMainProcess, command });
    await new Promise((resolve, reject) => {
      const buildProcess = spawn(command.spwanCmd, command.spawnArgs, command.spawnOptions);
      new CreateInterface({
        input: buildProcess.stdout,
      })
        .on('line', (message) => {
          this.add(`<i class="fab fa-docker" title="docker"></i> <i class="fas fa-hard-hat" title="build"></i> ${message}`, { source: 'stdout' }, { isMainProcess, pid: buildProcess.pid, command });
        });
      new CreateInterface({
        input: buildProcess.stderr,
      }).on('line', (message) => {
        this.add(`<i class="fab fa-docker" title="docker"></i> <i class="fas fa-hard-hat" title="build"></i> ${message}`, { source: 'stdout' }, { isMainProcess, pid: buildProcess.pid, command });
      });
      buildProcess.on('exit', (code) => {
        if (code) {
          this.exited = true;
          this.crashed = true;
          return reject(code);
        }
        return resolve(null);
      });
    });
    const baseArgs = ['run', '--name', this.container.name, '--init', '--rm', '--user', this.container.user || `${uid}:${gid}`, '--network', 'host', ...volumesCmd.flat(1)];
    args = [...baseArgs, this.container.name, originalCmd];
    if (this.container.bootstrap) {
      const bootstrapCommands = (Array.isArray(this.container.bootstrap)
        ? this.container.bootstrap
        : this.container.bootstrap.commands) || [];
      const concurrency = '';
      if (!concurrency || (concurrency && !bootstrapConcurrency[concurrency])) {
        bootstrapConcurrency[concurrency] = true;
        await PromiseB.mapSeries(bootstrapCommands, async (command) => {
          await new Promise((resolve, reject) => {
            const entrypoint = command.entrypoint ? ['--entrypoint', `${command.entrypoint}`] : [];
            const userEntrypoint = command.user ? ['--user', `${command.user || this.container.user || `${uid}:${gid}`}`] : [];
            const bootstrapArgs = [
              ...baseArgs,
              ...entrypoint.flat(1),
              ...userEntrypoint.flat(1),
              this.container.name,
              command.cmd,
            ].filter((a) => a);
            const commandBootstrap = {
              spawnCmd: 'docker',
              spawnArgs: bootstrapArgs,
              spawnOptions: { shell: isWindows ? process.env.ComSpec : '/bin/sh' },
            };
            this.add(`<i class="fab fa-docker" title="docker"></i> <i class="fas fa-hourglass-start" title="bootstrap"></i> ${commandBootstrap.spawnCmd} ${commandBootstrap.spawnArgs?.join(' ')}`, { source: 'stdout' }, { isMainProcess, pid: null, command: commandBootstrap });
            const bootstrapProcess = spawn(
              commandBootstrap.spawnCmd,
              commandBootstrap.spawnArgs,
              commandBootstrap.spawnOptions,
            );
            new CreateInterface({
              input: bootstrapProcess.stdout,
            })
              .on('line', (message) => {
                this.add(`<i class="fab fa-docker" title="docker"></i> <i class="fas fa-hourglass-start" title="bootstrap"></i> ${message}`, { source: 'stdout' }, { isMainProcess, pid: bootstrapProcess.pid, command: commandBootstrap });
              });
            new CreateInterface({
              input: bootstrapProcess.stderr,
            }).on('line', (message) => {
              this.add(`<i class="fab fa-docker" title="docker"></i> <i class="fas fa-hourglass-start" title="bootstrap"></i> ${message}`, { source: 'stderr' }, { isMainProcess, pid: bootstrapProcess.pid, command: commandBootstrap });
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
    await this.add('Attach to container...', { source: 'stdout' }, { pid: null, isMainProcess, command: { spwanCmd: cmd, spawnArgs: args, spawnOptions: options } });
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
};

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });
/**
 * @param {number} pid
 */
function killAsync(pid) {
  return new Promise((resolve, reject) => {
    kill(pid, (err, children) => {
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
