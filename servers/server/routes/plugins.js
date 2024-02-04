const express = require("express");
const router = express.Router();
const { findService } = require("../../../servers/server/models/stack");
const Stack = require("../../../servers/server/models/stack");
const plugins = require("../helpers/plugins");
const PromiseB = require("bluebird");

router.get("/services/:service", async function (req, res) {
  const service = findService(req.params.service);
  const services = await PromiseB.filter(plugins.forService, async (plugin) =>
    plugin.hidden ? !(await plugin.hidden(service, Stack)) : true
  );
  services.sort((a,b) => b.order - a.order)
  res.send(services);
});
router.get("/services", async function (req, res) {
  const services = await PromiseB.filter(plugins.forService, async (plugin) =>
    plugin.hidden ? !(await plugin.hidden(null, Stack)) : true
  );
  res.send(services);
});
router.get("/:type", async function (req, res) {
  /** @type {import("modules/views").PluginSM<null>[]} */
  // @ts-ignore
  const services = plugins[req.params.type];
  services.sort((a, b) => (a.order || 1000) - (b.order || 1000))
  res.send(services);
});
module.exports = router;
