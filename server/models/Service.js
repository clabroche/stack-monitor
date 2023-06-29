///<reference path="../../typings/index.d.ts">
const { spawn } = require('child_process')
const killport = require('kill-port')
const URL = require('url')
const path = require('path')
const Socket = require('../models/socket')
const psTree = require('ps-tree')
const PromiseB = require('bluebird')
const isWindows = require('../../server/helpers/isWindows')
const dayjs = require('dayjs')
const { v4 } = require('uuid')
const {stripAnsi, ansiconvert, unescapeAnsi} = require('../helpers/ansiconvert')
const createInterface = require('../helpers/readline')
const { existsSync, readFileSync } = require('fs-extra')
const pathfs = require('path')

/** @type {Record<string, {cmd: string, args: string[]}>} */
const alias = {
  ls: {cmd: `ls`, args: ['--color=force']},
  gco: {cmd: `git`, args: ['checkout']},
}

class Service {
  /**
   * @param {import('../../typings/index').NonFunctionProperties<Service>} service
   * @param {import('./stack')} Stack
   */
  constructor(service, Stack) {
    this.Stack = Stack
    /** @type {string} */
    this.label = service.label || ''
    /** @type {string} */
    this.description = service.description || ''
    /** 
     * @type {{
     *  home: string,
     *  remote: string,
     * }}
     * */
    this.git = {
      home: service.git?.home || '',
      remote: service.git?.remote || '',
    }
    /** @type {string} */
    this.documentation = service.documentation || ''
    /** @type {string} */
    this.url = service.url || ''
    /** @type {string[]} */
    this.urls = service.urls || []
    /** @type {string[]} */
    this.groups = service.groups || []
    /** @type {boolean} */
    this.enabled = service.enabled || false
    /** @type {boolean} */
    this.crashed = service.crashed || false
    /** 
     * @type {{
     *  spawnArgs?: string[],
     *  spawnCmd?: string,
     *  spawnOptions?: SpawnOptions
     * }[]}
     * */
    this.commands = service.commands || []
    /** @type {LogMessage[]} */
    this.store = service.store || []
    /** @type {import('child_process').ChildProcess[]} */
    this.pids = service.pids || []
    /** @type {string[]} */
    this.spawnArgs = service.spawnArgs || []
    /** @type {string} */
    this.spawnCmd = service.spawnCmd || ''
    /** @type {SpawnOptions} */
    this.spawnOptions = {
      cwd: service.spawnOptions?.cwd,
      env: service.spawnOptions?.env,
    }
    /** @type {string} */
    this.rootPath = service.rootPath || service.spawnOptions?.cwd?.toString?.() || service.commands?.[0]?.spawnOptions?.cwd?.toString?.() || ''
    /** @type {Parser[]} */
    this.logParsers = service.logParsers || []
    /** 
     * @type {{
     *   check: ((service: Service) => boolean | Promise<boolean>) | undefined,
     *   interval?: number
     * }}
     * */
    this.health = {
      check: service.health?.check,
      interval: service.health?.interval || 1000
    }

    if((this.spawnOptions.cwd || this.rootPath)) {
      const customEnvs = this.loadCustomEnv((this.spawnOptions.cwd || this.rootPath).toString())
      this.spawnOptions.overrideEnvs = customEnvs
    }
    this.commands.map(command => {
      if(command?.spawnOptions?.cwd) {
        const customEnvs = this.loadCustomEnv(command.spawnOptions.cwd.toString())
        command.spawnOptions.overrideEnvs = customEnvs
      }
    })

  }

  /** @param {string} path */
  loadCustomEnv(path) {
    const dotEnvPath = pathfs.resolve(path, '.env')
    if(existsSync(dotEnvPath) && readFileSync(dotEnvPath, {encoding: 'utf-8'}).trim()) {
      console.log(`! A .env will override your ${this.label} service !`)
      return require('dotenv').parse(readFileSync(dotEnvPath));
    }
  }

  exportInApi() {
    const res = {...this}
    // @ts-ignore
    delete res.pids
    // @ts-ignore
    delete res.store
    // @ts-ignore
    delete res.Stack
    return res
  }

  /** @return {Partial<import('../../typings/index').NonFunctionProperties<Service>>} */
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
    }
  }
  async restart() {
    await this.kill(false)
    await this.launch(false)
    this.Stack.getStack()?.triggerOnServiceRestart(this)
  }
  sendHasBeenModified() {
    Socket.io?.emit('conf:update', [this.label])
  }

  async kill(triggerEvent = true, keepEnabled = false) {
    await PromiseB.map(this.pids, async spawnedProcess => {
      if(!spawnedProcess.pid) return
      const children = await psTreeAsync(spawnedProcess.pid)
      children.map(({PID}) => process.kill(+PID, 'SIGKILL'))
      spawnedProcess.kill('SIGKILL')
    })
    const urls = [...this.urls || [], this.url].filter(a => a)
    if (urls.length) {
      await PromiseB.mapSeries(urls, async url => {
        const port = URL.parse(url).port
        if (port && !Number.isNaN(+port)) {
          await killport(+port).catch((err) => console.error('Error: (Kill port):', err?.message || err))
        }
      })
    }
    this.pids = []
    Socket.io?.emit('logs:clear', { label: this.label })
    this.store = []
    await new Promise(resolve => setTimeout(resolve, 100))
    this.enabled = keepEnabled
    this.crashed = false
    if(triggerEvent) this.Stack.getStack()?.triggerOnServiceKill(this)
    this.sendHasBeenModified()
  }
  async launch(triggerEvent = true) {
    this.store = []
    await this.kill(false, true).catch(console.error)
    if (this.spawnCmd) {
      this.launchProcess(
        this.spawnCmd,
        this.spawnArgs || [],
        this.spawnOptions
      )
    }
    if (this.commands?.length) {
      this.commands.forEach(command => {
        if (command?.spawnCmd) {
          this.launchProcess(
            command?.spawnCmd,
            command?.spawnArgs || [],
            command?.spawnOptions
          )
        }
      });
    }
    this.enabled = true
    if(triggerEvent) this.Stack.getStack()?.triggerOnServiceStart(this)
    this.sendHasBeenModified()
  }
  
  /**
   * 
   * @param {string} spawnCmd 
   * @param {string[]} spawnArgs 
   * @param {SpawnOptions} spawnOptions 
   */
  launchProcess(spawnCmd, spawnArgs = [], spawnOptions = {}, isMainProcess = true) {
    this.crashed = false
    const {cmd, args, options} = this.parseIncomingCommand(spawnCmd, spawnArgs, spawnOptions)
    const spawnProcess = spawn(cmd, args, {...options, detached: !isWindows})
    if (!this.pids) this.pids = []
    if (!this.pids) this.pids = []
    this.pids.push(spawnProcess)
    // @ts-ignore
    spawnProcess.title = this.label
    let lastDatePrinted = Date.now()
    /** @type {LogMessage[]} */
    const queue = []
    const stack = this.Stack.getStack()

    const add = (/** @type {Buffer | string} */ data, /** @type {Partial<LogMessage>} */ logMessageOverride) => {
      const timestamp = Date.now()
      
      const ansiMsg = unescapeAnsi(data.toString())
      const stripMsg = stripAnsi(ansiMsg)
      const htmlMessage = ansiMsg ? ansiconvert.toHtml(ansiMsg) : '<br/>'
      /** @type {LogMessage} */
      let line = {
        pid: spawnProcess.pid,
        msg: htmlMessage,
        raw: stripMsg,
        timestamp,
        label: this.label,
        json: null,
        debug: null ,
        ...logMessageOverride,
        id: v4(),
      }

      line = [...(stack?.logParsers || []), ...this.logParsers].reduce((line, parser) => {
        if(!parser?.transform) {
          console.error(`It seems your parser "${parser?.id}" has not a transform function. Please verify or disable it..`)
          return line
        }
        const result = parser.transform(line, this)
        if(!result?.id) {
          console.error(`It seems your parser "${parser.id}" not retrun correct value. Please verify or disable it..`)
          return line
        }
        return result
      }, line)

      if(line.hide) return

      if (line.source === 'stderr' && isMainProcess) {
        Socket.io?.emit('alert', { label: this.label, message: line.raw.toString(), type: 'error' })
      }

      if(timestamp > lastDatePrinted + 2000) {
        const date = `🕑  ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
        /**@type {LogMessage}*/
        const line = { id: v4(), raw: date, label: this.label, msg: date, timestamp, isSeparator: true }
        this.store.push(line)
        queue.push(line)
      }
      lastDatePrinted = Date.now()

      if(line.msg.length > 100000 && !line.msg.startsWith('["stack-monitor"')) line.msg = line.msg.slice(0, 10000)
      this.store.push(line)
      queue.push(line)
    }

    const intervalId = setInterval(() => {
      if(queue.length) {
        const messages = queue.splice(0, queue.length)
        Socket.io?.emit('logs:update', messages)
      }
    }, 0);
    new createInterface({
      input: spawnProcess.stdout,
      emitAfterNoDataMs: 100,
    })
    .on('line', (message) => add(message, {source: 'stdout'}))
    new createInterface({
      input: spawnProcess.stderr,
      emitAfterNoDataMs: 100,
    }).on('line', (message) => {
      add(message, {source: 'stderr'})
    });

    /** @type {LogMessage} */
    const launchMessage = {
      id: v4(),
      timestamp: Date.now(),
      label: this.label,
      pid: spawnProcess.pid,
      msg: `${cmd} ${args.join(' ')}`,
      raw: `${cmd} ${args.join(' ')}`,
      cmd: {
        cmd,
        args,
        options,
        status: 'running'
      }
    }
    spawnProcess.on('exit', (code, signal) => {
      setTimeout(() => {
        clearInterval(intervalId)
      }, 50);
      if (code) {
        if(launchMessage.cmd) launchMessage.cmd.status = 'error'
        if(isMainProcess) {
          Socket.io?.emit('service:crash', { label: this.label, code, signal, pid: spawnProcess.pid })
          this.Stack.getStack()?.triggerOnServiceCrash(this, code)
          this.crashed = true
        }
      } else {
        if(launchMessage.cmd) launchMessage.cmd.status = 'exited'
      }
      Socket.io?.emit('service:exit', { label: this.label, code, signal, pid: spawnProcess.pid })
      Socket.io?.emit('logs:update:lines', [launchMessage]) 
    })

    const date = `🕑  ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
    /**@type {LogMessage}*/
    const line = { id: v4(), raw: date, label: this.label, msg: date, timestamp: lastDatePrinted, isSeparator: true }
    this.store.push(line, launchMessage)
    Socket.io?.emit('logs:update', [line, launchMessage])

    if (isMainProcess) {
      this.launchHealthChecker(spawnProcess)
    }

    return {
      launchMessage,
      spawnProcess
    }
  }

  /**
   * 
   * @param {import('child_process').ChildProcessWithoutNullStreams} spawnProcess 
   */
  async launchHealthChecker(spawnProcess) {
    if (!spawnProcess.pid || !this.health?.check) return
    if (!(await psTreeAsync(spawnProcess.pid))?.length) return 
    let result
    try { result = await this.health.check(this) }
    catch (error) {
      console.error('Service health failed:' + error)
    }
    if(!result) {
      this.crashed = true
      Socket.io?.emit('service:healthcheck:down', { label: this.label, pid: spawnProcess.pid })
    } else {
      this.crashed = false
      Socket.io?.emit('service:healthcheck:up', { label: this.label, pid: spawnProcess.pid })
    }
    await new Promise(res => setTimeout(res ,this.health.interval))
    this.launchHealthChecker(spawnProcess)
    return
  }
  /**
   * 
   * @param {number} pid 
   * @param {string} message
   */
  respondToProcess(pid, message) {
    const process = this.pids.find(process => process.pid === pid)
    if(!process) return console.error(`Pid (${pid}) not found`)
    process.stdin?.write(message.trim() + '\n')

    /**@type {LogMessage}*/
    const line = {
      id: v4(),
      raw: message.trim() + '\n',
      label: this.label,
      msg: message.trim() + '\n',
      timestamp: Date.now(),
      prompt: true,
      pid: pid,
    }
    this.store.push(line)
    Socket.io?.emit('logs:update', [line])
  }
  /**
   * @param {number} pid 
   * @param {boolean} forceKill 
   */
  terminate(pid, forceKill = false) {
    const processFound = this.pids.find(process => process.pid === pid)
    if(!processFound) return console.error(`Pid (${pid}) not found`)
    if(processFound.pid) {
      isWindows
        ? process.kill(processFound.pid, 'SIGKILL')
        : process.kill(-processFound.pid, forceKill ? 'SIGKILL' : 'SIGTERM')
    }

  }

  enable() {
    this.enabled = true
    this.sendHasBeenModified()
  }
  /**
   * 
   * @param {string} spawnCmd 
   * @param {string[]} spawnArgs 
   * @param {SpawnOptions} spawnOptions 
   */
  parseIncomingCommand(spawnCmd, spawnArgs = [], spawnOptions = {}) {
    let cmd = spawnCmd?.split(' ')?.[0]
    let argFromCmd = spawnCmd?.split(' ')?.slice(1).join(' ')
    let args = [argFromCmd, ...spawnArgs].filter(a => a)

    const currentAlias = alias[cmd]
    if(currentAlias) {
      cmd = currentAlias?.cmd || cmd
      args = [...(currentAlias?.args || []), ...args]
    }

    let options = {
      ...spawnOptions,
      cwd: spawnOptions.cwd || this.rootPath,
      shell: isWindows ? process.env.ComSpec : '/bin/sh',
      env: {
        ...process.env,
        ...(spawnOptions.env || {}),
        ...spawnOptions.overrideEnvs || {}
      }
    }

    if (cmd.match(/[/\\]/g)) {
      cmd = path.resolve(options.cwd.toString(), cmd)
    }
    return {cmd, args, options}
  }
}

/**
 * 
 * @param {number} pid 
 * @returns {Promise<readonly psTree.PS[]>}
 */
function psTreeAsync(pid) {
  return new Promise((resolve, reject) => {
    psTree(pid, function (err, children) {
      if(err) return reject(err)
      return resolve(children)
    });
  })
};



module.exports = Service

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
 *  pid?: number,
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