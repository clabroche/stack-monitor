const pathfs = require('path')

const groups = {
  ui: '01 - UIs',
  api: '02 - APIs',
}

/** @type {import('./typings/index').StackFile} */
const stack = (stackMonitor) => {
  return {
    services: [
      {
        label: 'Server',
        description: 'This is the backend Stack monitor',
        groups: [groups.api],
        git: {
          home: 'https://github.com/clabroche/stack-monitor',
          remote: 'git@github.com:clabroche/stack-monitor.git'
        },
        url: `http://localhost:5459`,
        spawnCmd: 'npm',
        spawnArgs: ['run', 'serve:server'],
        spawnOptions: {
          cwd: pathfs.resolve(__dirname, 'server'),
          env: {
            NODE_ENV: 'DEV',
            HTTP_PORT: '5459',
          }
        }
      }, {
        label: 'Front',
        description: 'This is the front Stack monitor',
        groups: [groups.ui],
        git: {
          home: 'https://github.com/clabroche/stack-monitor',
          remote: 'git@github.com:clabroche/stack-monitor.git'
        },
        url: `http://localhost:5459`,
        spawnCmd: 'vite',
        spawnOptions: {
          cwd: __dirname,
          env: {
            NODE_ENV: 'DEV',
            VITE_HTTP_PORT: '5459',
          }
        }
      },
    ]
  }
}

module.exports = stack