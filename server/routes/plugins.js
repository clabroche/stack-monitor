var express = require('express');
var router = express.Router();
const { findService } = require('../../server/models/stack')
const plugins = require('../helpers/plugins')
const PromiseB = require('bluebird')

router.get('/services/:service', async function (req, res) {
  const service = findService(req.params.service)
  const services = await PromiseB.filter(plugins.forService, async plugin => plugin.hidden ? !await plugin.hidden(service) : true)
  res.send(services)
})
router.get('/services', async function (req, res) {
  const services = plugins.forService
  res.send(services)
})
router.get('/sidebar', async function (req, res) {
  const services = plugins.sidebar
  res.send(services)
})
module.exports = router;