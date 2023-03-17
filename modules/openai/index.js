const express = require('express');
const router = express.Router();

module.exports = {
  name: 'OpenAI',
  icon: 'fas fa-plus',
  placements: [{
    position: 'sidebar',
    label: 'OpenAi',
    icon: 'fas fa-brain',
    goTo: '/openai',
    active: 'openai',
  }],
  order: 6,
  routes: router.use('/openai', require('./routes'))
}