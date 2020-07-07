const express = require('express');
const router = express.Router();
const Stack = require('../models/stack')
const { spawn } = require('child_process')
const SpawnStore = require('../models/SpawnStore')
const Socket = require('../models/socket')
const { exec } = require('child_process');
const open = require('open');

router.get('/configuration', function (req, res) {
  res.json(Stack.stackConfig)
});
router.post('/choose', function (req, res) {
  Stack.stack = req.body
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
  res.send(service ? service.store : '')
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
  SpawnStore[service.label].kill('SIGQUIT')
  SpawnStore[service.label].kill('SIGTERM')
  SpawnStore[service.label].kill('SIGINT')
  SpawnStore[service.label].kill('SIGKILL')
  await new Promise(resolve => setTimeout(resolve, 100))
  launchService(service)
  res.send()
});


function launch() {
  Stack.stack.map(microservice => {
    microservice.store = ''
    launchService(microservice)
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
}

function findService(serviceLabel) {
  return Stack.stack.filter(s => s.label === serviceLabel)[0]
}

module.exports = router