const express = require('express');
const router = express.Router();

module.exports = {
  name: 'Logs',
  icon: 'fas fa-terminal',
  placements: ['service'],
  order: 2,
  routes: router.use('/logs', require('./routes'))
}