const { express } = require('@clabroche/common-express');
const { exec } = require('child_process');
const open = require('open');
const commandExists = require('command-exists').sync;
const Octokit = require('octokit');
const Stack = require('../models/stack');
const myConfs = require('../models/myConfs');

const router = express.Router();
const { findService } = Stack;

router.get('/has-update', async (req, res) => {
  try {
    const localVersion = `v${require('../helpers/version').version}`;
    const octokit = new Octokit.Octokit({ auth: process.env.GH_APIKEY });
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
  res.json({
    id: Object.keys(Stack.environments || {}).find((key) => (
      Stack.environments?.[key]?.label === Stack.getCurrentEnvironment()?.label
    )),
    ...Stack.getCurrentEnvironment(),
  });
});

router.post('/environment', async (req, res) => {
  const { environment } = req.body;
  if (!environment) return res.status(400).send('Provide an environment field in body');
  await Stack.getStack()?.changeEnvironment(environment);
  return res.json(Stack.getCurrentEnvironment());
});
router.get('/environments', (req, res) => {
  res.json(Stack.environments);
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
  const service = findService(req.params.service);
  const command = (commandExists('code') ? 'code' : null) || (commandExists('code-insiders') ? 'code-insiders' : null);
  if (command) {
    exec(`${command} .`, { cwd: service.rootPath });
  }
  res.send(command);
});
router.get('/:service/open-link-in-vs-code', (req, res) => {
  const service = findService(req.params.service);
  const command = (commandExists('code') ? 'code' : null) || (commandExists('code-insiders') ? 'code-insiders' : null);
  if (command) {
    exec(`${command} --goto "${req.query.link}" .`, { cwd: service.rootPath, env: process.env });
  }
  res.send(command);
});

router.get('/:service/open-folder', (req, res) => {
  const service = findService(req.params.service);
  if (service.rootPath) {
    open(service.rootPath.toString());
  }
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
