const express = require('express');
const { execAsyncWithoutErr } = require('../helpers/exec');
const router = express.Router();
const isWindows = require('../helpers/isWindows');
const commandExists = require('command-exists');
const { findService } = require('../models/stack')
const pathfs = require('path')
const fse = require('fs-extra')
router.get('/:service', async (req, res) => {
  const tscExists = await commandExists('tsc')
    .then(() => true)
    .catch(() => false);
    console.log(tscExists)
  if (!tscExists) {
    return res.status(500).json({code: 'TSC_NOT_FOUND'})
  }

  try {
    const service = findService(req.params.service)
    const jsConfigExists = await fse.existsSync(pathfs.resolve(service.spawnOptions.cwd, 'jsconfig.json'))
    if(!jsConfigExists) {
      return res.status(500).json({ code: 'JSCONFIG_NOT_FOUND' })
    }
    const result = isWindows 
      ? await getBugsFromWindows(service)
      : await getBugsFromLinux(service)
    res.json(result)
  } catch (error) {
    res.status(500).json(error)    
  }
})
module.exports = router;


function getBugsFromWindows(service) {
  return execAsyncWithoutErr(
    'tsc --noEmit -p .\\jsconfig.json | findstr /V node_modules | findstr /V ".*.spec.*" |  findstr src',
    { cwd: service.spawnOptions.cwd }
  ).then((errors) => errors.toString().trim().split('\n'))
}


function getBugsFromLinux(service) {
  return execAsyncWithoutErr(
    'tsc --noEmit -p ./jsconfig.json | grep -v node_modules | grep -v ".*.spec.*" | grep src',
    { cwd: service.spawnOptions.cwd }
  ).then((errors) => errors.toString().trim().split('\n'))
}