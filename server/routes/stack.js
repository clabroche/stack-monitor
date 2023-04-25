const express = require('express');
const router = express.Router();
const Stack = require('../models/stack')
const findService = Stack.findService
const { exec } = require('child_process');
const open = require('open');
const myConfs = require('../models/myConfs');
const commandExists = require('command-exists').sync;

router.get('/configuration', function (req, res) {
  res.json(Stack.getStack()?.exportInApi())
});
router.get('/environment', function (req, res) {
  res.json({
    id: Object.keys(Stack.environments || {}).find(key => Stack.environments?.[key]?.label === Stack.getCurrentEnvironment()?.label),
    ...Stack.getCurrentEnvironment()
  })
});

router.post('/environment', async function (req, res) {
  const {environment} = req.body
  if(!environment) return res.status(400).send('Provide an environment field in body')
  await Stack.getStack()?.changeEnvironment(environment)
  res.json(Stack.getCurrentEnvironment())
});
router.get('/environments', function (req, res) {
  res.json(Stack.environments)
});
router.get('/all-confs-path', function (req, res) {
  res.json(myConfs.confs)
});
router.post('/select-conf', async function (req, res) {
  const { path } = req.body
  await Stack.selectConf(path)
  res.json(path)
});
router.post('/delete-conf', async function (req, res) {
  const { path } = req.body
  await myConfs.remove(path)
  res.json(path)
});
router.post('/choose', function (req, res) {
  /** @type {string[]} */
  const servicesLabelSelected = req.body
  if(!Array.isArray(servicesLabelSelected)) return res.status(400).send('you should provide an array as body with all service label you want to launch')
  const stack = Stack.getStack()
  if(!stack) return res.status(500).send('Stack not configured')
  stack.enable(servicesLabelSelected)
  stack.launch()
  res.json(stack.getEnabledServices().map(s => s.exportInApi()))
});
router.get('/', function (req, res) {
  const stack = Stack.getStack()
  res.json(stack ? stack.exportInApi() : null)
});
router.get('/services', function (req, res) {
  res.json(Stack.getServices().map(s => s.exportInApi()))
});
router.get('/:service', function (req, res) {
  const service = findService(req.params.service)
  res.send(service.exportInApi())
});
router.get('/:service/open-in-vs-code', function (req, res) {
  const service = findService(req.params.service)
  let command = (commandExists('code') ? 'code' : null) || (commandExists('code-insiders') ? 'code-insiders' : null)
  if (command) {
    exec(`${command} .`, { cwd: service.rootPath })
  }
  res.send(command)
});
router.get('/:service/open-link-in-vs-code', function (req, res) {
  const service = findService(req.params.service)
  let command = (commandExists('code') ? 'code' : null) || (commandExists('code-insiders') ? 'code-insiders' : null)
  if(command) {
    exec(`${command} --goto "${req.query.link}" .`, { cwd: service.rootPath, env: process.env })
  }
  res.send(command)
});

router.get('/:service/open-folder', function (req, res) {
  const service = findService(req.params.service)
  if (service.rootPath) {
    open(service.rootPath.toString())
  }
  res.send()
});

router.get('/:service/restart', async function (req, res) {
  const service = findService(req.params.service)
  await service.restart()
  res.send()
});
router.get('/:service/start', async function (req, res) {
  const service = findService(req.params.service)
  service.launch()
  res.send()
});

router.get('/:service/stop', async function (req, res) {
  const service = findService(req.params.service)
  await service.kill()
  res.send()
});


module.exports = router