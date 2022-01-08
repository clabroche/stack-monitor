const express = require('express');
const router = express.Router();
const Npm = require('./Npm')
module.exports = {
  name: 'Npm',
  icon: 'fab fa-npm',
  placements: ['service'],
  order: 3,
  hidden: async (service) => {
    const project = new Npm(service)
    const serviceIsNpm = await project.isNpm()
    return !serviceIsNpm
  },
  routes: router.use('/npm', require('./routes'))
}