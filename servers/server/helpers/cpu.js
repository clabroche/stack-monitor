const os = require('os');
const { fork } = require('node:child_process');
const path = require('path');
const { sockets } = require('@clabroche/common-socket-server');

const nbCpus = os.cpus().length;

/** @type {AbortController | null} */
let controller = null;
/** @type { import('child_process').ChildProcess | null } */
let child = null;
controller = new AbortController();
const { signal } = controller;
child = fork(path.resolve(__dirname, './cpuFork.js'), [], { signal });
child.on('message', (message) => {
  const { ram, cpu } = JSON.parse(message.toString());
  sockets.emit('infos:global', {
    nbCpus,
    memPercentage: ram.memPercentage,
    totalmem: ram.totalmem,
    freemem: ram.freemem,
    cpu,
  });
});

module.exports = {
  stopCpu: async () => {
    child?.kill('SIGKILL');
  },
};
