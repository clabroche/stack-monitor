const express = require('express');
const router = express.Router();

/** @type {import('../views').PluginSM} */
const plugin = {
  name: 'Logs',
  icon: 'fas fa-terminal',
  placements: ['service'],
  order: 2,
  routes: router.use('/logs', require('./routes'))
}
module.exports = plugin
