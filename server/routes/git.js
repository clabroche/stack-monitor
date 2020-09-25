const express = require('express');
const router = express.Router();
const {findService} = require('../helpers/services')
const { exec } = require('child_process')

function execAsync(cmd, options) {
  return new Promise((res, rej) => {
    exec(cmd, options, (err, stdout, stderr) => {
      if (stderr || err) return rej(stderr || err)
      res(stdout)
    })
  })

}

router.get('/:service/branches', async function (req, res) {
  const service = findService(req.params.service)
  res.json(await getBranches(service))
})
router.get('/:service/status', async function (req, res) {
  const service = findService(req.params.service)
  res.json(await getStatus(service))
})

router.post('/:service/branch/:branchName/change', async function (req, res) {
  try {
    const service = findService(req.params.service)
    await execAsync('git checkout ' + req.params.branchName, { cwd: service.spawnOptions.cwd })
    res.send('ok')
  } catch (error) {
    res.status(500).json(error)
  }
})

router.delete('/:service/reset', async function (req, res) {
  try {
    const service = findService(req.params.service)
    exec('git reset --hard', { cwd: service.spawnOptions.cwd })
    res.json('ok')
  } catch (error) {
    res.status(500).json('ko')
  }
})

router.delete('/:service/checkout/:file', async function (req, res) {
  try {
    const service = findService(req.params.service)
    exec('git checkout ' + req.params.file.trim(), { cwd: service.spawnOptions.cwd })
    res.json('ok')
  } catch (error) {
    res.status(500).json('ko')
  }
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