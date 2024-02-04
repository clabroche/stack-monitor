const os = require('os');
const osutils = require('os-utils');

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