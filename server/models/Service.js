///<reference path="../../typings/index.d.ts">
const { spawn } = require('child_process')
const killport = require('kill-port')
const URL = require('url')
const path = require('path')
const Socket = require('../models/socket')
const PromiseB = require('bluebird')
const isWindows = require('../../server/helpers/isWindows')


module.exports = class Service {
  /** @param {import('../../typings/index').NonFunctionProperties<Service>} service */
  constructor(service) {
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
      home: service?.git?.home || '',
      remote: service?.git?.remote || '',
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
    /** 
     * @type {{
     *  spawnArgs?: string[],
     *  spawnCmd?: string,
     *  spawnOptions?: SpawnOptions
     * }[]}
     * */
    this.commands = service.commands || []
    /** @type {string} */
    this.store = service.store || ''
    /** @type {import('child_process').ChildProcess[]} */
    this.pids = service.pids || []
    /** @type {string[]} */
    this.spawnArgs = service.spawnArgs || []
    /** @type {string} */
    this.spawnCmd = service.spawnCmd || ''
    /** @type {SpawnOptions} */
    this.spawnOptions = {
      cwd: service?.spawnOptions?.cwd,
      env: service?.spawnOptions?.env,
    }
  }

  exportInApi() {
    const res = {...this}
    // @ts-ignore
    delete res.pids
    // @ts-ignore
    delete res.store
    return res
  }

  /** @return {Partial<import('../../typings/index').NonFunctionProperties<Service>>} */
  exportForDifference() {
    return {
      label: this.label,
      commands: this.commands,
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
    require('./stack').getStack()?.triggerOnServiceRestart(this)
  }

  async kill(triggerEvent = true) {
    this.pids.forEach(process => process.kill('SIGKILL'))
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
    this.store = ''
    await new Promise(resolve => setTimeout(resolve, 100))
    this.enabled = false
    if(triggerEvent) require('./stack').getStack()?.triggerOnServiceKill(this)
  }
  launch(triggerEvent = true) {
    this.store = ''
    if (this?.spawnCmd) {
      this.launchProcess(
        this?.spawnCmd,
        this?.spawnArgs || [],
        this?.spawnOptions
      )
    }
    if (this?.commands?.length) {
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
    if(triggerEvent) require('./stack').getStack()?.triggerOnServiceStart(this)
  }
  
  /**
   * 
   * @param {string} spawnCmd 
   * @param {string[]} spawnArgs 
   * @param {SpawnOptions} spawnOptions 
   */
  launchProcess(spawnCmd, spawnArgs = [], spawnOptions = {}) {
    let cwd = spawnOptions.cwd
    spawnOptions.shell = isWindows ? process.env.ComSpec : '/bin/sh'
    if (cwd && spawnCmd.match(/[\/\\]/g)) {
      spawnCmd = path.resolve(cwd?.toString(), spawnCmd)
    }
    let envs = spawnOptions.env || {}
    if (spawnOptions && spawnOptions.env) {
      envs = Object.assign({}, process.env, spawnOptions.env)
    }
    const spawnProcess = spawn(spawnCmd, spawnArgs, { ...spawnOptions, env: envs })
    if (!this.pids) this.pids = []
    if (!this.pids) this.pids = []
    this.pids.push(spawnProcess)
    // @ts-ignore
    spawnProcess.title = this.label
    let lineNotFinished = ''
    const add = (/** @type {Buffer} */ data) => {
      let line = data.toString()
      if (!line.endsWith('\n') && !line.endsWith('\r\n')) {
        lineNotFinished += line
        return
      } else {
        line = lineNotFinished + line
        lineNotFinished = ''
      }
      if (line) {
        this.store += line?.slice(0, 10000)
        Socket.io?.emit('logs:update', { msg: line, label: this.label })
      }
    }
    spawnProcess.stdout?.on('data', add)
    spawnProcess.stderr?.on('data', (message) => {
      if (!message.toString().includes('webpack.Progress')) {
        Socket.io?.emit('alert', { label: this.label, message: message.toString(), type: 'error' })
      }
      add(message)
    })
  }

  enable() {
    this.enabled = true
  }

}

/**
 * @typedef {import('child_process').ExecOptions} SpawnOptions
 */