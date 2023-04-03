const express = require('express');
const router = express.Router();
const { findService } = require('../../server/models/stack')
const { execAsync, execAsyncWithoutErr } = require('../../server/helpers/exec')
const isWindows = require('../../server/helpers/isWindows');
const commandExists = require('command-exists')

router.get('/:service/graph', async function(req, res) {
  const service = findService(req.params.service)
  const graphOnAll = req.query.graphOnAll === 'true'
  if (!service?.spawnOptions?.cwd) return res.json([])
  // const format = `{
  //   ^@^commit^@^: ^@^%H^@^, 
  //   ^@^abbreviated_commit^@^: ^@^%h^@^,
  //   ^@^tree^@^: ^@^%T^@^,
  //   ^@^abbreviated_tree^@^: ^@^%t^@^,
  //   ^@^parent^@^: ^@^%P^@^,
  //   ^@^abbreviated_parent^@^: ^@^%p^@^,
  //   ^@^refs^@^: ^@^%D^@^,
  //   ^@^encoding^@^: ^@^%e^@^,
  //   ^@^subject^@^: ^@^%s^@^,
  //   ^@^sanitized_subject_line^@^: ^@^%f^@^,
  //   ^@^body^@^: ^@^%b^@^,
  //   ^@^commit_notes^@^: ^@^^@^,
  //   ^@^verification_flag^@^: ^@^%G?^@^,
  //   ^@^signer^@^: ^@^%GS^@^,
  //   ^@^signer_key^@^: ^@^%GK^@^,
  //   ^@^author^@^: {
  //     ^@^name^@^: ^@^%aN^@^,
  //     ^@^email^@^: ^@^%aE^@^,
  //     ^@^date^@^: ^@^%aD^@^
  //   },
  //   ^@^commiter^@^: {
  //     ^@^name^@^: ^@^%cN^@^,
  //     ^@^email^@^: ^@^%cE^@^,
  //     ^@^date^@^: ^@^%cD^@^ 
  //   }
  // },`;
  const cmd = `git -c color.ui=always log  --decorate=full --oneline --graph ${(graphOnAll ? '--all' : '')} -500`;
  const result = await execAsync(cmd, { cwd: service.spawnOptions.cwd, shell: true, stdio: '', env: process.env });
  // res.json(JSON.parse(`[${(("" + result).replace(/"/gm, '\\"').replace(/\^@\^/gm, '"')).slice(0,-1)}]`))
  res.json(result.split('\n'))
})

router.get('/:service/branches', async function (req, res) {
  const service = findService(req.params.service)
  if (!service?.spawnOptions?.cwd) return res.json([])
  res.json(await getBranches(service))
})
router.get('/:service/status', async function (req, res) {
  const service = findService(req.params.service)
  if (!service?.spawnOptions?.cwd) return res.json([])
  res.json(await getStatus(service))
})
router.get('/:service/diff', async function (req, res) {
  const service = findService(req.params.service)
  if (!service?.spawnOptions?.cwd) return res.json([])
  res.json(await execAsync(`git diff --minimal`, { cwd: service.spawnOptions.cwd }))
})

router.post('/:service/branch/:branchName/change', async function (req, res) {
  try {
    const service = findService(req.params.service)
    if (!service?.spawnOptions?.cwd) return res.json([])
    await execAsync('git checkout ' + req.params.branchName, { cwd: service.spawnOptions.cwd })
    res.send('ok')
  } catch (error) {
    res.status(500).json(error)
  }
})

router.get('/:service/branch/:branchName/remote-delta', async function (req, res) {
  try {
    const service = findService(req.params.service)
    if (!service?.spawnOptions?.cwd) return res.json([])
    await execAsync(`git branch --set-upstream-to=origin/${req.params.branchName} ${req.params.branchName}`, { cwd: service.spawnOptions.cwd })
    await execAsync(`git fetch origin ${req.params.branchName}`, { cwd: service.spawnOptions.cwd })
    const localCommit = await execAsync(`git log --oneline ${req.params.branchName}`, { cwd: service.spawnOptions.cwd })
    const remoteCommit = await execAsync(`git log --oneline origin/${req.params.branchName}`, { cwd: service.spawnOptions.cwd })
    const delta = localCommit.trim().split("\n").length - remoteCommit.trim().split("\n").length
    res.json(delta)
  } catch (error) {
    res.status(500).json(error)
  }
})

router.post('/:service/fetch', async function (req, res) {
  try {
    const service = findService(req.params.service)
    if (!service?.spawnOptions?.cwd) return res.json([])
    await execAsync(`git fetch`, { cwd: service.spawnOptions.cwd })
    res.json('ok')
  } catch (error) {
    res.status(500).json(error)
  }
})

router.delete('/:service/reset', async function (req, res) {
  try {
    const service = findService(req.params.service)
    if (!service?.spawnOptions?.cwd) return res.json([])
    await execAsync('git reset --hard', { cwd: service.spawnOptions.cwd })
    res.json('ok')
  } catch (error) {
    res.status(500).json('ko')
  }
})
router.post('/:service/pull', async function (req, res) {
  try {
    const service = findService(req.params.service)
    if (!service?.spawnOptions?.cwd) return res.json([])
    const origin = (await execAsync('git remote -v | grep fetch', { cwd: service.spawnOptions.cwd })).split('\t')[0]?.trim() || ''
    const currentBranch = (await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: service.spawnOptions.cwd }))?.trim()
    console.log(currentBranch)
    await execAsync(`git pull ${origin} ${currentBranch}`, { cwd: service.spawnOptions.cwd })
    res.json('ok')
  } catch (error) {
    res.status(500).json(error)
  }
})
router.post('/:service/stash', async function (req, res) {
  try {
    const service = findService(req.params.service)
    if (!service?.spawnOptions?.cwd) return res.json([])
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
    if (!service?.spawnOptions?.cwd) return res.json([])
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
    if (!service?.spawnOptions?.cwd) return res.json([])
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
    if (!service?.spawnOptions?.cwd) return res.json([])
    await execAsync('git pull', { cwd: service.spawnOptions.cwd })
    res.json('ok')
  } catch (error) {
    res.status(500).json('ko')
  }
})

router.delete('/:service/checkout/:file', async function (req, res) {
  try {
    const service = findService(req.params.service)
    if (!service?.spawnOptions?.cwd) return res.json([])
    await execAsync('git checkout ' + req.params.file.trim(), { cwd: service.spawnOptions.cwd })
    res.json('ok')
  } catch (error) {
    res.status(500).json('ko')
  }
})

async function getBranches(project) {
  return execAsyncWithoutErr('git branch', { cwd: project.spawnOptions.cwd })
    .then((res) => res.toString().trim().split('\n'))
}

async function getStatus(project) {
  return execAsyncWithoutErr('git status -s', { cwd: project.spawnOptions.cwd })
    .then((res) => res.toString().trim().split('\n')?.filter(a => a))
}

module.exports = router