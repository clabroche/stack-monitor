const { spawn } = require('child_process')
const SpawnStore = require('../models/SpawnStore')
const killport = require('kill-port')
const url = require('url')
const path = require('path')
const Socket = require('../models/socket')

module.exports = {
  async  killService(service) {
    SpawnStore[service.label].kill('SIGKILL')
    if (service.url) {
      const port = url.parse(service.url).port
      await killport(port)
    }
    Socket.socket.emit('logs:clear', { label: service.label })
    service.store = ''
    await new Promise(resolve => setTimeout(resolve, 100))
    service.enabled = false
  },
  launchService(microservice) {
    let { spawnOptions = {}, cwd, spawnCmd} = microservice || {}
    spawnOptions.shell = true
    if (cwd && spawnCmd.match(/\/|\\/g)) {
      spawnCmd = path.resolve(cwd, spawnCmd)
    }
    let envs = spawnOptions.env || {}
    if(spawnOptions && spawnOptions.env) {
      envs = Object.assign({}, process.env, spawnOptions.env)
    }
    SpawnStore[microservice.label] = spawn(spawnCmd, microservice.spawnArgs || [], {...spawnOptions, env: envs})
    const store = SpawnStore[microservice.label]
    store.title = microservice.label
    microservice.pid = store.pid
    const add = data => {
      const line = data.toString()
      microservice.store += line
      Socket.socket.emit('logs:update', { msg: line, label: microservice.label })
    }
    store.stdout.on('data', add)
    store.stderr.on('data', (message)=> {
      if (!message.toString().includes('webpack.Progress')) {
        Socket.socket.emit('alert', { label: microservice.label, message: message.toString(), type: 'error' })
      }
      add(message)
    })
    microservice.enabled = true
  }
}