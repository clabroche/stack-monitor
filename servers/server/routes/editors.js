const { express } = require('@clabroche/common-express');
const { availableEditors, getCommandLine } = require('../models/editors');
const { replaceEnvs } = require('../helpers/stringTransformer.helper');
const Stack = require('../models/stack');
const { exec } = require('child_process');
const { findService } = Stack;

const router = express.Router();

router.get('/available-editors', (req, res) => {
  res.send(availableEditors);
});

router.get('/:service/open-in-vs-code', (req, res) => {
  const service = findService(req.params.service);
  const commandLine = getCommandLine(req.query.editor)
  if(!commandLine) return res.status(400).send('Editor not found')
  exec(commandLine, { cwd: replaceEnvs(service.rootPath) || replaceEnvs(req.query.path?.toString() || '.'), env: process.env });
  res.send('ok');
});

router.get('/:service/open-link-in-vs-code', (req, res) => {
  const service = findService(req.params.service);
  const commandLine = getCommandLine(req.query.editor, { link: req.query.link?.toString() || '' })
  if (!commandLine) return res.status(400).send('Editor not found')
  const cwd = replaceEnvs(service.rootPath) || replaceEnvs(req.query.path?.toString() || '.')
  exec(commandLine, { cwd, env: process.env });
  res.send({ commandLine, cwd});
});

module.exports = router