const express = require('express');
const router = express.Router();
const {findService} = require('../models/stack')
const {execAsync, execAsyncWithoutErr} = require('../helpers/exec')
const isWindows = require('../helpers/isWindows');

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

router.get('/:service/branch/:branchName/remote-delta', async function (req, res) {
  try {
    const service = findService(req.params.service)
    const nbLocalCommit = isWindows
      ? await execAsync(`git log --oneline ${req.params.branchName} | find /c /v ""`, { cwd: service.spawnOptions.cwd })
      : await execAsync(`git log --oneline ${req.params.branchName} | wc -l`, { cwd: service.spawnOptions.cwd })
    const nbRemoteCommit = isWindows
      ? await execAsync(`git log --oneline origin/${req.params.branchName} | find /c /v ""`, { cwd: service.spawnOptions.cwd })
      : await execAsync(`git log --oneline origin/${req.params.branchName} | wc -l`, { cwd: service.spawnOptions.cwd })
    const delta = (+nbLocalCommit.trim()) - (+nbRemoteCommit.trim())
    res.json(delta)
  } catch (error) {
    res.status(500).json(error)
  }
})

router.post('/:service/fetch', async function (req, res) {
  try {
    const service = findService(req.params.service)
    await execAsync(`git fetch`, { cwd: service.spawnOptions.cwd })
    res.json('ok')
  } catch (error) {
    res.status(500).json(error)
  }
})

router.delete('/:service/reset', async function (req, res) {
  try {
    const service = findService(req.params.service)
    await execAsync('git reset --hard', { cwd: service.spawnOptions.cwd })
    res.json('ok')
  } catch (error) {
    res.status(500).json('ko')
  }
})
router.post('/:service/pull', async function (req, res) {
  try {
    const service = findService(req.params.service)
    await execAsync('git pull', { cwd: service.spawnOptions.cwd })
    res.json('ok')
  } catch (error) {
    res.status(500).json(error)
  }
})
router.post('/:service/stash', async function (req, res) {
  try {
    const service = findService(req.params.service)
    await execAsync('git add .', { cwd: service.spawnOptions.cwd })
    await execAsync('git stash', { cwd: service.spawnOptions.cwd })
    res.json('ok')
  } catch (error) {
    res.status(500).json('ko')
  }
})
router.post('/:service/stash-pop', async function (req, res) {
  try {
    const service = findService(req.params.service)
    await execAsync('git stash pop', { cwd: service.spawnOptions.cwd })
    await execAsync('git reset HEAD', { cwd: service.spawnOptions.cwd })
    res.json('ok')
  } catch (error) {
    res.status(500).json('ko')
  }
})
router.post('/:service/stash-list', async function (req, res) {
  try {
    const service = findService(req.params.service)
    const list = await execAsync('git stash show', { cwd: service.spawnOptions.cwd })
      .catch(() => null)
    res.json(list)
  } catch (error) {
    console.error(error)
    res.status(500).json('ko')
  }
})
router.post('/:service/pull', async function (req, res) {
  try {
    const service = findService(req.params.service)
    await execAsync('git pull', { cwd: service.spawnOptions.cwd })
    res.json('ok')
  } catch (error) {
    res.status(500).json('ko')
  }
})

router.delete('/:service/checkout/:file', async function (req, res) {
  try {
    const service = findService(req.params.service)
    await execAsync('git checkout ' + req.params.file.trim(), { cwd: service.spawnOptions.cwd })
    res.json('ok')
  } catch (error) {
    res.status(500).json('ko')
  }
})

async function getBranches(project) {
  if (!project) return []
  return execAsyncWithoutErr('git branch', {cwd: project.spawnOptions.cwd}) 
    .then((res) => res.toString().trim().split('\n'))
}

async function getStatus(project) {
  if (!project) return []
  return execAsyncWithoutErr('git status -s', { cwd: project.spawnOptions.cwd })
    .then((res) => res.toString().trim().split('\n'))
}

module.exports = router