const express = require('express');
const router = express.Router();
const fse = require('fs-extra')
const pathfs = require('path')

module.exports = {
  name: 'Bugs',
  icon: 'fas fa-bug',
  placements: ['service'],
  order: 4,
  hidden: async (service) => {
    const serviceIsNpm = await isNpm(service)
    return !serviceIsNpm
  },
  routes: router.use('/bugs', require('./routes'))
}

async function isNpm (service) {
  const path = service?.spawnOptions?.cwd
  return path 
    ? fse.existsSync(pathfs.resolve(path, 'package.json'))
    : false
}