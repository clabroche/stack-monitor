const pathfs = require('path');
require('dotenv').config();

const { STACKFILE } = process.env;
if (!STACKFILE) throw new Error('No Stack file to launch');

const groups = {
  ui: '01 - UIs',
  api: '02 - APIs',
};

/** @type {import('@clabroche/common-typings').StackFile} */
const stack = (stackMonitor) => ({
  monorepo: true,
  services: [
    {
      label: 'Server',
      description: 'This is the backend Stack monitor',
      groups: [groups.api],
      git: {
        home: 'https://github.com/clabroche/stack-monitor',
        remote: 'git@github.com:clabroche/stack-monitor.git',
      },
      url: 'http://localhost:5459',
      spawnCmd: 'npm',
      spawnArgs: ['run serve'],
      spawnOptions: {
        cwd: pathfs.resolve(__dirname, './servers/server'),
        env: {
          STACKFILE: pathfs.resolve(__dirname, STACKFILE),
          NODE_ENV: 'DEV',
          HTTP_PORT: '5459',
        },
      },
    }, {
      label: 'Front',
      description: 'This is the front Stack monitor',
      groups: [groups.ui],
      git: {
        home: 'https://github.com/clabroche/stack-monitor',
        remote: 'git@github.com:clabroche/stack-monitor.git',
      },
      url: 'http://localhost:5173',
      spawnCmd: 'yarn vite',
      spawnOptions: {
        cwd: pathfs.resolve(__dirname, './fronts/app'),
        env: {
          NODE_ENV: 'DEV',
          VITE_HTTP_PORT: '5459',
        },
      },
    },
  ],
});

module.exports = stack;
