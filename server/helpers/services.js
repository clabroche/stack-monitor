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
    microservice.spawnOptions = microservice.spawnOptions || {}
    microservice.spawnOptions.shell = true
    if (microservice.spawnOptions.cwd && microservice.spawnCmd.match(/\/|\\/g)) {
      microservice.spawnCmd = path.resolve(microservice.spawnOptions.cwd, microservice.spawnCmd)
    }
    SpawnStore[microservice.label] = spawn(microservice.spawnCmd, microservice.spawnArgs || [], microservice.spawnOptions)
    SpawnStore[microservice.label].title = microservice.label
    microservice.pid = SpawnStore[microservice.label].pid
    const add = data => {
      const line = data.toString()
      microservice.store += line
      Socket.socket.emit('logs:update', { msg: line, label: microservice.label })
    }
    SpawnStore[microservice.label].stdout.on('data', add)
    SpawnStore[microservice.label].stderr.on('data', (message)=> {
      if (!message.toString().includes('webpack.Progress')) {
        Socket.socket.emit('alert', { label: microservice.label, message: message.toString(), type: 'error' })
      }
      add(message)
    })
    microservice.enabled = true
  }
}