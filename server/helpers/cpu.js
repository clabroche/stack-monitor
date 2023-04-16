const os = require('os');
const Socket = require('../models/socket');
const { fork } = require('node:child_process');
const { exec, ChildProcess } = require('child_process')
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
  const line = await new Promise(resolve => {
    exec('free -t --mega | grep Total', (err, stdout) => resolve(stdout))
  });
  const regex = /\d+/gm;
  let m;
  /** @type {number[]} */
  let res = [];

  while ((m = regex.exec(line)) !== null) {
    if (m.index === regex.lastIndex) regex.lastIndex++;
    m.forEach(match => res.push(Number.isNaN(+match) ? 0 : +match));
  }
  return {
    memPercentage: res[0] ? res[1] * 100 / res[0] : 0,
    totalmem: res[0],
    freemem: res[5],
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