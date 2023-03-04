const express = require('express');
const router = express.Router();
const { findService } = require('../models/stack')
const SpawnStore = require('../models/SpawnStore')
const { exec } = require('child_process')
const osutils = require('os-utils');
const pidusageTree = require('pidusage-tree')
const os = require('os')

router.get('/global-infos', async function (req, res) {
  const ram = await getRam()
  try {
    res.json({
      nbCpus,
      memPercentage: ram.memPercentage,
      totalmem: ram.totalmem,
      freemem: ram.freemem,
      cpu: cpuUsage
    })
  } catch (e) {
    res.json({ cpu: null, mem: null, memPercentage: null, freemem: null, totalmem: null })
  }
})

router.get('/:service/infos', async function (req, res) {
  try {
    const service = findService(req.params.service)
    res.json(await getCPU(SpawnStore[service.label][0]?.pid))
  } catch (e) {
    res.json({ cpu: null, mem: null })
  }
})

router.get('/disconnect', async function () {
  process.exit(0)
})


const nbCpus = os.cpus().length
let cpuUsage = 0
setInterval(() => {
  osutils.cpuUsage(function (v) {
    cpuUsage = v
  })
}, 1100);

async function getRam() {
  const line = await new Promise(resolve => {
    exec('free -t --mega | grep Total', (err, stdout) => resolve(stdout))
  });
  const regex = /\d+/gm;
  let m;
  let res = [];

  while ((m = regex.exec(line)) !== null) {
    if (m.index === regex.lastIndex) regex.lastIndex++;
    m.forEach(match => res.push(match));
  }
  return {
    memPercentage: res[1] * 100 / res[0],
    totalmem: res[0],
    freemem: res[5],
  }
}
async function getCPU(pid) {
  const tree = await pidusageTree(pid).catch(() => {
    return null
  })
  let cpus = []
  let mem = 0
  let cpuPerc = 0
  let totalMem = 0
  if (tree) {
    Object.keys(tree).forEach(key => {
      if (tree[key] && tree[key].cpu) cpus.push(tree[key].cpu)
      if (tree[key] && tree[key].memory) mem += tree[key].memory
    })
    cpuPerc = cpus.reduce((prev, curr) => {
      return prev + curr
    }, 0) / cpus.length
    totalMem = os.totalmem()
  }
  return {
    cpu: Number.isNaN(cpuPerc / 10) ? 0 : cpuPerc / 10,
    mem: mem / totalMem
  }
}

module.exports = router