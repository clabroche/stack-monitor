const path = __dirname
const pathfs = require('path')
require('dotenv').config({ path: pathfs.resolve(__dirname, '.env') })
const githubTagsScript = require('./scripts/tags')
const { default: axios } = require('axios')

const groups = {
  API: 'api',
  UI: 'ui',
  MISC: 'misc'
}

/** @type {import('../server/models/stack.js').StackFile} */
const stack = (stackMonitor) => {
  // Env definition, you can switch in GUI
  /** @type {import('./env.local.js')} */
  const env = stackMonitor.setEnvironments({
    LOCAL: {
      label: 'Local',
      envs: require('./env.local'),
      color: 'white',
      bgColor: '#074971'
    },
    PREPROD: {
      label: 'Preprod',
      envs: require('./env.preprod'),
      color: 'white',
      bgColor: '#0000ff'
    }
  }, 'LOCAL')

  // Hook system
  stackMonitor.onLaunch(() => {
    const message = stackMonitor.getEnabledServices()
      .map(service => ` - ${service.label}`)
      .join('\n')
    console.log('These services are launched:')
    console.log(message)
  })

  stackMonitor.onServiceRestart((service) => {
    console.log(service?.label, 'restart')
  })

  stackMonitor.onServiceStart((service) => {
    console.log(service?.label, 'start')
  })

  stackMonitor.onServiceKill((service) => {
    console.log(service?.label, 'kill')
  })

  stackMonitor.globalScripts.addScript(githubTagsScript(stackMonitor))

  // Build your definition
  return {
    // Stack monitor can reload services impacted by changes in this files 
    watchFiles: [
      require.resolve('./env.local'),
      require.resolve('./env.preprod'),
      require.resolve('./scripts/tags'),
    ],
    logParsers: [
      stackMonitor.parsers.links,
      stackMonitor.parsers.jsons,
      stackMonitor.parsers.debug,
    ],
    stack: [
      {
        label: 'Server',
        description: 'This is the backend of an unbelievable project',
        groups: [groups.API],
        documentation: path + '/documentation/server',
        logParsers: [
          {
            id: 'health-hide-parser',
            transform: (msg) => {
              // @ts-ignore
              if(msg?.json?.route === '/health') msg.hide = true
              return msg
            }
          }
        ],
        health: {
          check: async (service) => {
            const { data } = await axios.get('http://localhost:3009')
            return data
          },
          interval: 500
        },
        git: {
          home: 'https://github.com/clabroche/stack-monitor',
          remote: 'git@github.com:clabroche/stack-monitor.git'
        },
        rootPath: pathfs.resolve(__dirname, '..'),
        url: `http://localhost:${env?.SERVER_PORT}`,
        spawnCmd: 'npm',
        spawnArgs: ['run', 'serve'],
        spawnOptions: {
          cwd: `${path}/server`,
          env: {
            PORT: env?.SERVER_PORT,
            mongoDbURL: env?.mongoDbURL,
          }
        }
      },
      
      {
        label: 'Front',
        description: 'This is the front of an unbelievable project',
        groups: [groups.UI],
        git: {
          home: 'https://<an-awesome-url>',
          remote: 'git@github.com:<your-beautiful-profile>/<your-excellent-project>.git'
        },
        rootPath: pathfs.resolve(__dirname, '..'),
        url: `http://localhost:${env?.UI_PORT}`,
        spawnCmd: 'npm',
        spawnArgs: ['run', 'serve'],
        spawnOptions: {
          cwd: `${path}/front`,
          env: {
            UI_PORT: env?.UI_PORT,
            VITE_APP_API_URL: env?.SERVER_URL
          }
        }
      },
  
      {
        label: 'Hello',
        description: 'Just Hello',
        rootPath: pathfs.resolve(__dirname, '..'),
        groups: [groups.MISC, "Hello", "Hello World"],
        spawnCmd: 'echo',
        spawnArgs: ['hello'],
      },
      
      {
        label: 'World',
        description: 'All the world',
        rootPath: pathfs.resolve(__dirname, '..'),
        groups: [groups.MISC, "World", "Hello World"],
        spawnCmd: 'echo',
        spawnArgs: ['world'],
      },
      
      {
        label: 'Mongo',
        rootPath: pathfs.resolve(__dirname, '..'),
        groups: [groups.MISC],
        description: 'Just start the mongodb in docker',
        spawnCmd: 'docker',
        spawnArgs: ['start', 'mongo'],
      }, 
      
      {
        label: 'Multiple Commands',
        rootPath: pathfs.resolve(__dirname, '..'),
        description: 'Launch multiple commands at once',
        groups: [groups.MISC],
        commands: [{
          spawnCmd: 'echo',
          spawnArgs: ['coucou1'],
        }, {
          spawnCmd: 'echo',
          spawnArgs: ['coucou2'],
        }]
      },
    ]
  }
} 
module.exports = stack