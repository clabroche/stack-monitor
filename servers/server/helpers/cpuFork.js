const os = require('os');
const osutils = require('os-utils');

function cpuUsagePromise() {
  return new Promise((resolve) => {
    osutils.cpuUsage((v) => {
      resolve(v);
    });
  });
}

async function getRam() {
  const freemem = os.freemem();
  const totalmem = os.totalmem();

  return {
    memPercentage: totalmem ? (freemem * 100) / totalmem : 0,
    totalmem,
    freemem,
  };
}

const wait = (/** @type {number} */ms) => new Promise((res) => { setTimeout(res, ms); });

async function launch() {
  try {
    const ram = await getRam();
    const cpu = await cpuUsagePromise();
    if (process.connected) {
      process?.send?.(JSON.stringify({ ram, cpu }));
    } else {
      process.exit(1);
    }
  } catch (error) { }
  await wait(500);
  launch();
}
launch();
