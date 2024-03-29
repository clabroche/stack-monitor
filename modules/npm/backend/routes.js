const express = require('express');

const router = express.Router();
const Npm = require('./Npm');

/** @param {import('@clabroche/common-typings').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  const { findService } = stackMonitor;

  router.get('/npm/:service', async (req, res) => {
    const service = findService(req.params.service);
    const npm = new Npm(service);
    const isNpm = await npm.isNpm();
    res.json(isNpm);
  });

  router.get('/npm/:service/packagejson', async (req, res) => {
    const service = findService(req.params.service);
    const npm = new Npm(service);
    const packagejson = await npm.packageJSON();
    res.json(packagejson);
  });

  router.get('/npm/:service/outdated', async (req, res) => {
    const service = findService(req.params.service);
    const npm = new Npm(service);
    const packagejson = await npm.outdated();
    res.json(packagejson);
  });

  return router;
};
