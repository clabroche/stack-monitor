const pathfs = require('path');
require('dotenv').config();

const { STACKFILE, SERVICE } = process.env;
if (!STACKFILE) throw new Error('No Stack file to launch');

const groups = {
  ui: '01 - UIs',
  api: '02 - APIs',
};

/** @type {import('@clabroche/common-typings').StackFile} */
const stack = (stackMonitor) => ({
  monorepo: true,
  logParsers: [
    stackMonitor.parsers.links,
    stackMonitor.parsers.jsons,
    stackMonitor.parsers.debug,
  ],
  services: [
    {
      label: 'Front',
      description: 'This is the front Stack monitor',
      groups: [groups.ui],
      git: {
        home: 'https://github.com/clabroche/stack-monitor',
        remote: 'git@github.com:clabroche/stack-monitor.git',
      },
      url: 'http://localhost:5459',
      spawnCmd: 'yarn vite',
      spawnOptions: {
        cwd: pathfs.resolve(__dirname, './fronts/app'),
        env: {
          NODE_ENV: 'DEV',
        },
      },
    }, {
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
          SERVICE,
          ADDWORKING_PATH: '/home/coco/Projects/addworking/services',
          STACKFILE: pathfs.resolve(__dirname, STACKFILE),
          NODE_ENV: 'DEV',
          HTTP_PORT: '5459',
        },
      },
    }, {
      label: 'Private Server',
      description: 'This is the private backend Stack monitor',
      groups: [groups.api],
      git: {
        home: 'https://github.com/clabroche/stack-monitor',
        remote: 'git@github.com:clabroche/stack-monitor.git',
      },
      url: 'http://localhost:5460',
      spawnCmd: 'npm',
      spawnArgs: ['run serve'],
      spawnOptions: {
        cwd: pathfs.resolve(__dirname, './servers/private'),
        env: {
          MONGO_URL: process.env.MONGO_URL,
          NODE_ENV: 'development',
          HTTP_PORT: '5460',
          JWT_PRIVATE_KEY: 'fekfzelkfzezefkzejfzekfjzeklfgjzegjgzngziajfrpafze',
        },
      },
    }, {
      label: 'Server Prod',
      description: 'This is the backend Stack monitor',
      groups: [groups.api],
      git: {
        home: 'https://github.com/clabroche/stack-monitor',
        remote: 'git@github.com:clabroche/stack-monitor.git',
      },
      url: 'http://localhost:5460',
      spawnCmd: 'npm',
      spawnArgs: ['run serve'],
      spawnOptions: {
        cwd: pathfs.resolve(__dirname, './servers/server'),
        env: {
          SERVICE,
          STACKFILE: pathfs.resolve(__dirname, STACKFILE),
          NODE_ENV: 'production',
          HTTP_PORT: '5460',
        },
      },
    }, {
      label: 'Docs',
      groups: [groups.ui],
      git: {
        home: 'https://github.com/clabroche/stack-monitor',
        remote: 'git@github.com:clabroche/stack-monitor.git',
      },
      url: 'http://localhost:5174',
      spawnCmd: 'npm',
      spawnArgs: ['run serve'],
      spawnOptions: {
        cwd: pathfs.resolve(__dirname, './fronts/docs'),
        env: {
        },
      },
    },
  ],
});

module.exports = stack;
