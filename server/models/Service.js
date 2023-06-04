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
    this.launch(false)
    this.Stack.getStack()?.triggerOnServiceRestart(this)
  }
  sendHasBeenModified() {
    Socket.io?.emit('conf:update', [this.label])
  }

  async kill(triggerEvent = true) {
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
    const psList = (/** @type {any[]} */ ...args) => import('ps-list').then(({ default: fetch }) => fetch(...args));
    const list = await psList()
    const toKill = list.filter(({ cmd }) =>
      (
        (cmd?.includes('nodemon') || cmd?.includes('php')) &&
        this.spawnOptions?.cwd &&
        cmd?.includes(this.spawnOptions.cwd.toString())
      ) || (
        cmd === "php artisan serve" &&
        this.spawnCmd === 'php' && this.spawnArgs.includes('artisan') && this.spawnArgs.includes('serve')
      )
    )
    toKill.forEach(({ pid }) => process.kill(pid, 'SIGKILL'))
    this.pids = []
    Socket.io?.emit('logs:clear', { label: this.label })
    this.store = []
    await new Promise(resolve => setTimeout(resolve, 100))
    this.enabled = false
    this.crashed = false
    if(triggerEvent) this.Stack.getStack()?.triggerOnServiceKill(this)
    this.sendHasBeenModified()
  }
  launch(triggerEvent = true) {
    this.store = []
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
  launchProcess(spawnCmd, spawnArgs = [], spawnOptions = {}) {
    this.crashed = false
    const {cmd, args, options} = this.parseIncomingCommand(spawnCmd, spawnArgs, spawnOptions)
    const spawnProcess = spawn(cmd, args, options)
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
      if(timestamp > lastDatePrinted + 2000) {
        const date = `🕑  ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
        /**@type {LogMessage}*/
        const line = { id: v4(), raw: date, label: this.label, msg: date, timestamp, isSeparator: true }
        this.store.push(line)
        queue.push(line)
      }
      lastDatePrinted = Date.now()
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
      if (!message.toString().includes('webpack.Progress')) {
        Socket.io?.emit('alert', { label: this.label, message: message.toString(), type: 'error' })
      }
      add(message, {source: 'stderr'})
    });
    spawnProcess.on('exit', (code, signal) => {
      setTimeout(() => {
        clearInterval(intervalId)
      }, 50);
      if (code) {
        Socket.io?.emit('service:crash', { label: this.label, code, signal, pid: spawnProcess.pid })
        this.Stack.getStack()?.triggerOnServiceCrash(this, code)
        this.crashed = true
      } else {
        Socket.io?.emit('service:exit', { label: this.label, code, signal, pid: spawnProcess.pid })
      }

    })

    const date = `🕑  ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
    /**@type {LogMessage}*/
    const line = { id: v4(), raw: date, label: this.label, msg: date, timestamp: lastDatePrinted, isSeparator: true }
    this.store.push(line)
    queue.push(line)
    
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
      }
    }
    this.store.push(launchMessage)
    Socket.io?.emit('logs:update', [launchMessage]) 
    return {
      launchMessage,
      spawnProcess
    }
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
   * 
   * @param {number} pid 
   */
  terminate(pid) {
    const process = this.pids.find(process => process.pid === pid)
    if(!process) return console.error(`Pid (${pid}) not found`)
    process.kill('SIGTERM')
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
        ...(spawnOptions.env || {})
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
 * @typedef {import('child_process').ExecOptions} SpawnOptions
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
 *  cmd?: {cmd: string, args: string[], options: import('child_process').ExecOptions},
 * }} LogMessage
 */

/**
 * @typedef {{
 *  id: string,
 *  transform: ((msg: LogMessage, service?: Service | null) => LogMessage)
 * }} Parser
 */