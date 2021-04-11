const express = require('express');
const router = express.Router();
const Stack = require('../models/stack')
const {launch, findService} = require('../models/stack')
const Socket = require('../models/socket')
const { exec } = require('child_process');
const open = require('open');
const{killService, launchService} =require('../helpers/services')

router.get('/configuration', function (req, res) {
  res.json(Stack.stack)
});
router.post('/choose', function (req, res) {
  const servicesLabelSelected = req.body
  Stack.stack.map(service => {
    if (servicesLabelSelected.includes(service.label)) {
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


module.exports = router