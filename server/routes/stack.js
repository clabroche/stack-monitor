const express = require('express');
const router = express.Router();
const Stack = require('../models/stack')
const { spawn } = require('child_process')
const SpawnStore = require('../models/SpawnStore')
const Socket = require('../models/socket')
const { exec } = require('child_process');
const killport = require('kill-port')
const open = require('open');
const url = require('url')

router.get('/configuration', function (req, res) {
  res.json(Stack.stack)
});
router.post('/choose', function (req, res) {
  const servicesLabelSelected = req.body
  Stack.stack.map(service => {
    if(servicesLabelSelected.includes(service.label)) {
      service.enabled = true
    }
  })
  launch()
  res.json(Stack.stack)
});
router.get('/', function (req, res) {
  res.json(Stack.stack)
});
router.get('/:service', function (req, res) {
  const service = findService(req.params.service)
  res.send(service)
});
router.get('/:service/logs', function (req, res) {
  const service = findService(req.params.service)
  res.send(service ? service.store : '')
});
router.delete('/:service/logs', function (req, res) {
  const service = findService(req.params.service)
  service.store = ''
  Socket.socket.emit('logs:clear', { label: service.label })
  res.send(service.store)
});
router.get('/:service/open-in-vs-code', function (req, res) {
  const service = findService(req.params.service)
  exec('code .', { cwd: service.spawnOptions.cwd })
  res.send()
});

router.get('/:service/open-folder', function (req, res) {
  const service = findService(req.params.service)
  open(service.spawnOptions.cwd)
  res.send()
});

router.get('/:service/restart', async function (req, res) {
  const service = findService(req.params.service)
  await killService(service)
  launchService(service)
  res.send()
});
router.get('/:service/start', async function (req, res) {
  const service = findService(req.params.service)
  launchService(service)
  res.send()
});

router.get('/:service/stop', async function (req, res) {
  const service = findService(req.params.service)
  killService(service)
  res.send()
});

async function killService(service) {
  SpawnStore[service.label].kill('SIGKILL')
  if (service.url) {
    const port = url.parse(service.url).port
    await killport(port)
  }
  Socket.socket.emit('logs:clear', { label: service.label })
  service.store = ''
  await new Promise(resolve => setTimeout(resolve, 100))
  service.enabled = false
}

function launch() {
  Stack.stack.forEach(microservice => {
    microservice.store = ''
    if(microservice.enabled) {
      launchService(microservice)
    }
  })
}


function launchService(microservice) {
  microservice.spawnOptions = microservice.spawnOptions || {}
  microservice.spawnOptions.shell = true
  SpawnStore[microservice.label] = spawn(microservice.spawnCmd, microservice.spawnArgs || [], microservice.spawnOptions)
  SpawnStore[microservice.label].title = microservice.label
  microservice.pid = SpawnStore[microservice.label].pid
  SpawnStore[microservice.label].stdout.on('data', data => {
    const line = data.toString()
    microservice.store += line
    Socket.socket.emit('logs:update', { msg: line, label: microservice.label })
  })
  SpawnStore[microservice.label].stderr.on('data', data => {
    const line = data.toString()
    microservice.store += line
    Socket.socket.emit('logs:update', { msg: line, label: microservice.label })
  })
  microservice.enabled = true
}

function findService(serviceLabel) {
  return Stack.stack.filter(s => s.label === serviceLabel)[0]
}

module.exports = router