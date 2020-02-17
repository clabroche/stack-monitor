const express = require('express');
const router = express.Router();
const {findService} = require('../helpers/services')
const { exec } = require('child_process')


router.get('/:service/branches', async function (req, res) {
  const service = findService(req.params.service)
  res.json(await getBranches(service))
})
router.get('/:service/status', async function (req, res) {
  const service = findService(req.params.service)
  res.json(await getStatus(service))
})

function getBranches(project) {
  if (!project) return []
  return new Promise(resolve => {
    exec('git branch', {
      cwd: project.spawnOptions.cwd
    }, (err, stdout) => {
      resolve(stdout.toString().trim().split('\n'))
    })
  });
}

function getStatus(project) {
  return new Promise(resolve => {
    if (!project) return resolve([])
    exec('git status -s', {
      cwd: project.spawnOptions.cwd
    }, (err, stdout) => {
      resolve(stdout.toString().trim().split('\n'))
    })
  });
}


module.exports = router