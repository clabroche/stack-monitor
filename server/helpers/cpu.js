const os = require('os');
const Socket = require('../models/socket');
const { fork } = require('node:child_process');
const { ChildProcess } = require('child_process')
const osutils = require('os-utils');

const nbCpus = os.cpus().length

function cpuUsagePromise() {
  return new Promise(resolve => {
    osutils.cpuUsage(function (v) {
      resolve(v)
    })
  })
}

async function getRam() {
  const freemem = os.freemem();
  const totalmem = os.totalmem();

  return {
    memPercentage: totalmem ? freemem * 100 / totalmem : 0,
    totalmem: totalmem,
    freemem: freemem,
  }
}

const wait = (/** @type {number}*/ms) => new Promise(res => setTimeout(res, ms))

/** @type {AbortController | null} */
let controller = null
/** @type { ChildProcess | null } */
let child = null
if (process.argv[2] === 'child') {
  async function launch() {
    try {
      const ram = await getRam()
      const cpu = await cpuUsagePromise()
      process?.send?.(JSON.stringify({ram, cpu}))
    } catch (error) { }
    await wait(500)
    launch()
  }
  launch()
} else {
  controller = new AbortController();
  const { signal } = controller;
  child = fork(__filename, ['child'], { signal });
  child.on('message', (message) => {
    const { ram, cpu } = JSON.parse(message.toString())
    Socket?.io?.emit('infos:global', {
      nbCpus,
      memPercentage: ram.memPercentage,
      totalmem: ram.totalmem,
      freemem: ram.freemem,
      cpu
    })
  });
}

module.exports = {
  stopCpu: async () => {
    child?.kill('SIGKILL')
  }
}