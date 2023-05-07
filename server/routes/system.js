const express = require('express');
const router = express.Router();
const Stack = require('../models/stack')
// @ts-ignore
const pidusageTree = require('pidusage-tree')
const os = require('os');

router.get('/:service/infos', async function (req, res) {
  try {
    const service = Stack.findService(req.params.service)
    const pid = service.pids[0]?.pid
    res.json(pid ? await getCPU(pid) : {
      cpu: null,
      ram: null
    })
  } catch (e) {
    res.json({ cpu: null, mem: null })
  }
})

router.get('/disconnect', async function () {
  process.exit(0)
})

/** @param {number} pid */
async function getCPU(pid) {
  const tree = await pidusageTree(pid).catch(() => {
    return null
  })
  /** @type {number[]} */
  let cpus = []
  let mem = 0
  let cpuPerc = 0
  let totalMem = 0
  if (tree) {
    Object.keys(tree).forEach(key => {
      if (tree[key]?.cpu) cpus.push(tree[key].cpu)
      if (tree[key]?.memory) mem += tree[key].memory
    })
    cpuPerc = cpus.reduce((prev, curr) => {
      return prev + curr
    }, 0) / cpus.length
    totalMem = os.totalmem()
  }
  return {
    cpu: Number.isNaN(cpuPerc) ? 0 : cpuPerc,
    mem: mem / totalMem
  }
}

module.exports = router