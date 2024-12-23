const { express } = require('@clabroche/common-express');
const { exec } = require('child_process');
const open = require('open');
const commandExists = require('command-exists').sync;
const Octokit = require('octokit');
const { sockets } = require('@clabroche/common-socket-server');
const Stack = require('../models/stack');
const myConfs = require('../models/myConfs');

const router = express.Router();
const { findService } = Stack;
const Service = require('../models/Service');
const Environment = require('../models/Environment');
const { replaceEnvs } = require('../helpers/stringTransformer.helper');

router.post('/services', async (req, res) => {
  const existingService = Stack.findService(req.body.label);
  if (existingService) {
    await existingService.constructor(req.body, Stack, { isUpdate: true });
    await existingService.save();
    sockets.emit('conf:update', [existingService.label]);
    res.send(existingService);
  } else {
    const service = await new Service(req.body, Stack);
    await service.save();
    Stack.getStack()?.services.push(service);
    sockets.emit('conf:update', [service.label]);
    res.send(service);
  }
});

router.put('/:service/duplicate', async (req, res) => {
  const existingService = findService(req.params.service).toStorage();
  const service = await new Service(existingService, Stack);
  service.label = req.body.label;
  await service.save();
  Stack.getStack()?.services.push(service);
  sockets.emit('conf:update');
  res.send(service);
});
router.patch('/:service', async (req, res) => {
  const service = findService(req.params.service);
  await service.save();
  Stack.getStack()?.services.push(service);
  sockets.emit('conf:update');
  res.send(service);
});

router.get('/export-env', async (req, res) => {
  const service = findService(req.query.service?.toString() || '');
  if (!service) return res.status(404).send('Service not found');
  const command = service.commands?.[+(req.query.commandIndex?.toString() || '0')];
  if (!command) return res.status(404).send('Command not found');
  const envs = await service.buildEnvs(req.query.environment, command.spawnOptions);
  res.send(envs);
});

router.delete('/:service', async (req, res) => {
  await Stack.deleteService(req.params.service);
  sockets.emit('conf:update');
  res.send('ok');
});

router.get('/has-update', async (req, res) => {
  try {
    const localVersion = `v${require('../helpers/version').version}`;
    const octokit = new Octokit.Octokit({ auth: process.env.STACK_MONITOR_GH_APIKEY });
    const { data: tags } = await octokit.rest.repos.listTags({ owner: 'clabroche', repo: 'stack-monitor' });
    const remoteVersion = tags[0]?.name;
    return res.json({
      local: localVersion,
      remote: remoteVersion,
      hasUpdate: localVersion !== remoteVersion,
    });
  } catch (error) {
    console.error(error);
    return res.json(null);
  }
});

router.get('/configuration', (req, res) => {
  res.json(Stack.getStack()?.exportInApi());
});
router.get('/environment', (req, res) => {
  res.json(Stack.getCurrentEnvironment());
});

router.patch('/environments/:environmentLabel', async (req, res) => {
  const env = await Stack.getStack()?.environments.find((env) => env.label === req.params.environmentLabel);
  if (!env) return res.status(404).send('Environment not found');
  await env.update(req.body);
  await sockets.emit('reloadEnvironments');
  res.json(Stack.getCurrentEnvironment());
});

router.delete('/environments/:environmentLabel', async (req, res) => {
  const env = await Stack.getStack()?.environments.find((env) => env.label === req.params.environmentLabel);
  if (!env) return res.status(404).send('Environment not found');
  await env.delete();
  await sockets.emit('reloadEnvironments');
  res.json('ok');
});

router.get('/additional-themes', (req, res) => {
  const additionalThemes = Stack.getStack()?.themes || {};
  res.json(additionalThemes);
});

router.post('/environment', async (req, res) => {
  const { environment } = req.body;
  if (!environment) return res.status(400).send('Provide an environment field in body');
  await Stack.getStack()?.changeEnvironment(environment);
  return res.json(Stack.getCurrentEnvironment());
});
router.post('/environment/create', async (req, res) => {
  const { environment } = req.body;
  if (!environment) return res.status(400).send('Provide an environment field in body');
  const newEnvironment = new Environment(environment);
  await newEnvironment.save();
  await sockets.emit('reloadEnvironments');
  return res.json(Stack.getCurrentEnvironment());
});
router.get('/environments', async (req, res) => {
  res.json(await Environment.all());
});
router.get('/all-confs-path', (req, res) => {
  res.json(myConfs.confs);
});
router.post('/select-conf', async (req, res) => {
  const { path } = req.body;
  await Stack.selectConf(path);
  res.json(path);
});
router.post('/delete-conf', async (req, res) => {
  const { path } = req.body;
  await myConfs.remove(path);
  res.json(path);
});
router.post('/choose', async (req, res) => {
  /** @type {{label: string, enabled: boolean}[]} */
  const servicesLabelSelected = req.body;
  if (!Array.isArray(servicesLabelSelected)) return res.status(400).send('you should provide an array as body with all service label you want to launch');
  const stack = Stack.getStack();
  if (!stack) return res.status(500).send('Stack not configured');
  await stack.enable(servicesLabelSelected);
  return res.json(stack.getEnabledServices().map((s) => s.exportInApi()));
});
router.get('/', (req, res) => {
  const stack = Stack.getStack();
  res.json(stack ? stack.exportInApi() : null);
});

router.get('/open-link-in-vs-code', (req, res) => {
  const command = (commandExists('code') ? 'code' : null) || (commandExists('code-insiders') ? 'code-insiders' : null);
  if (command) {
    exec(`${command} --goto "${req.query.link}" .`, { cwd: req.query.root?.toString() || '.', env: process.env });
  }
  res.send(command);
});

router.get('/services', (req, res) => {
  res.json(Stack.getServices().map((s) => s.exportInApi()));
});

router.get('/:service', (req, res) => {
  const service = findService(req.params.service);
  res.send(service.exportInApi());
});
router.get('/:service/open-in-vs-code', (req, res) => {
  const command = (commandExists('code') ? 'code' : null) || (commandExists('code-insiders') ? 'code-insiders' : null);
  if (command) {
    exec(`${command} .`, { cwd: replaceEnvs(req.query.path?.toString() || '.') });
  }
  res.send(command);
});
router.get('/:service/open-link-in-vs-code', (req, res) => {
  const command = (commandExists('code') ? 'code' : null) || (commandExists('code-insiders') ? 'code-insiders' : null);
  if (command) {
    exec(`${command} --goto "${req.query.link}" .`, { cwd: replaceEnvs(req.query.path?.toString() || '.'), env: process.env });
  }
  res.send(command);
});

router.get('/:service/open-folder', (req, res) => {
  open(replaceEnvs(req.query.path?.toString() || '.'));
  res.send();
});

router.get('/:service/restart', async (req, res) => {
  const service = findService(req.params.service);
  await service.restart();
  res.send();
});
router.get('/:service/start', async (req, res) => {
  const service = findService(req.params.service);
  await service.launch();
  res.send();
});

router.get('/:service/stop', async (req, res) => {
  const service = findService(req.params.service);
  await service.kill();
  res.send();
});

module.exports = router;
