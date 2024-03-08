const { express } = require('@clabroche/common-express');

const router = express.Router();
const PromiseB = require('bluebird');
const { findService } = require('../models/stack');
const Stack = require('../models/stack');
const plugins = require('../helpers/plugins');

router.get('/services/:service', async (req, res) => {
  const service = findService(req.params.service);
  const services = await PromiseB.filter(plugins.forService, async (plugin) => (plugin.hidden ? !(await plugin.hidden(service, Stack, 'service')) : true));
  services.sort((a, b) => (b?.order || Number.MAX_SAFE_INTEGER) - (a?.order || Number.MAX_SAFE_INTEGER));
  res.send(services);
});
router.get('/services', async (req, res) => {
  const services = await PromiseB.filter(plugins.forService, async (plugin) => (plugin.hidden ? !(await plugin.hidden(null, Stack, 'global')) : true));
  res.send(services);
});
router.get('/:type', async (req, res) => {
  /** @type {import("@clabroche/modules-plugins-loader-front/src/views").PluginSM<null>[]} */
  // @ts-ignore
  const services = await PromiseB.filter(plugins[req.params.type], async (plugin) => (plugin.hidden ? !(await plugin.hidden(null, Stack, req.params.type)) : true));
  services.sort((a, b) => (a.order || 1000) - (b.order || 1000));
  res.send(services);
});
module.exports = router;
