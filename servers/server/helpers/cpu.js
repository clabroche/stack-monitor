const os = require('os');
const Socket = require('../models/socket');
const { fork } = require('node:child_process');
const { ChildProcess } = require('child_process')
const path = require('path');

const nbCpus = os.cpus().length

/** @type {AbortController | null} */
let controller = null
/** @type { ChildProcess | null } */
let child = null
controller = new AbortController();
const { signal } = controller;
child = fork(path.resolve(__dirname, './cpuFork.js'), [], { signal });
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

module.exports = {
  stopCpu: async () => {
    child?.kill('SIGKILL')
  }
}