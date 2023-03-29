const { spawn } = require('child_process')
const SpawnStore = require('../models/SpawnStore')
const killport = require('kill-port')
const URL = require('url')
const path = require('path')
const Socket = require('../models/socket')
const PromiseB = require('bluebird')

module.exports = {
  async  killService(service) {
    SpawnStore[service.label].forEach(process => process.kill('SIGKILL'))
    const urls = [...service.urls || [], service.url].filter(a => a)
    if (urls.length) {
      await PromiseB.mapSeries(urls, async url => {
        const port = URL.parse(url).port
        if (port && !Number.isNaN(+port)) {
          await killport(+port).catch(console.error)
        }
      })
    }
    const psList = (...args) => import('ps-list').then(({ default: fetch }) => fetch(...args));
    const list = await psList()
    const toKill = list.filter(({ cmd }) => 
      (
        (cmd?.includes('nodemon') || cmd?.includes('php')) && 
        cmd?.includes(service.spawnOptions.cwd)
      ) || (
        cmd === "php artisan serve" && 
        service.spawnCmd === 'php' && service.spawnArgs.includes('artisan') && service.spawnArgs.includes('serve')
      )
    )
    toKill.forEach(({pid}) => process.kill(pid, 'SIGKILL'))
    SpawnStore[service.label] = []
    Socket.socket.emit('logs:clear', { label: service.label })
    service.store = ''
    await new Promise(resolve => setTimeout(resolve, 100))
    service.enabled = false
  },
  launchService(microservice = {}) {
    if (microservice?.spawnCmd) {
      launchProcess(
        microservice,
        microservice?.spawnCmd,
        microservice?.spawnArgs || [],
        microservice?.spawnOptions
      )
    }
    if(microservice?.commands) {
      microservice.commands.forEach(command => {
        if(command?.spawnCmd) {
          launchProcess(
            microservice,
            command?.spawnCmd,
            command?.spawnArgs || [],
            command?.spawnOptions
          )
        }
      });
    }
    microservice.enabled = true
  }
}

function launchProcess(microservice, spawnCmd, spawnArgs = [], spawnOptions = {}) {
  let cwd = spawnOptions.cwd
  spawnOptions.shell = true
  if (cwd && spawnCmd.match(/[\/\\]/g)) {
    spawnCmd = path.resolve(cwd, spawnCmd)
  }
  let envs = spawnOptions.env || {}
  if (spawnOptions && spawnOptions.env) {
    envs = Object.assign({}, process.env, spawnOptions.env)
  }
  const spawnProcess = spawn(spawnCmd, spawnArgs, { ...spawnOptions, env: envs })
  if (!SpawnStore[microservice.label]) SpawnStore[microservice.label] = []
  if (!microservice.pids) microservice.pids = []
  SpawnStore[microservice.label].push(spawnProcess)
  spawnProcess.title = microservice.label
  microservice.pids.push(spawnProcess.pid)
  let lineNotFinished = ''
  const add = data => {
    let line = data.toString()
    if (!line.endsWith('\n') && !line.endsWith('\r\n')) {
      lineNotFinished += line
      return
    } else {
      line = lineNotFinished + line
      lineNotFinished = ''
    }
    if (line) {
      microservice.store += line?.slice(0, 10000)
      Socket.socket.emit('logs:update', { msg: line, label: microservice.label })
    }
  }
  spawnProcess.stdout.on('data', add)
  spawnProcess.stderr.on('data', (message) => {
    if (!message.toString().includes('webpack.Progress')) {
      Socket.socket.emit('alert', { label: microservice.label, message: message.toString(), type: 'error' })
    }
    add(message)
  })
}
