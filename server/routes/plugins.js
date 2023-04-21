const express = require("express");
const router = express.Router();
const { findService } = require("../../server/models/stack");
const plugins = require("../helpers/plugins");
const PromiseB = require("bluebird");

router.get("/services/:service", async function (req, res) {
  const service = findService(req.params.service);
  const services = await PromiseB.filter(plugins.forService, async (plugin) =>
    plugin.hidden ? !(await plugin.hidden(service)) : true
  );
  res.send(services);
});
router.get("/services", async function (req, res) {
  const services = plugins.forService;
  res.send(services);
});
router.get("/:type", async function (req, res) {
  // @ts-ignore
  const services = plugins[req.params.type];
  res.send(services);
});
module.exports = router;
