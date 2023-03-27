const path = __dirname

const env = require('./env.local')
// const env = require('./env.preprod')
// const env = require('./env.prod')

const groups = {
  API: 'api',
  UI: 'ui',
  MISC: 'misc'
}

module.exports = {
  watchFiles: [
    require.resolve('./env.local')
  ],
  stack: [
    {
      label: 'Server',
      description: 'This is the backend of an unbelievable project',
      groups: [groups.API],
      git: {
        home: 'https://<an-awesome-url>',
        remote: 'git@github.com:<your-beautiful-profile>/<your-excellent-project>.git'
      },
      url: `http://localhost:${env.SERVER_PORT}`,
      spawnCmd: 'npm',
      spawnArgs: ['run', 'serve'],
      spawnOptions: {
        cwd: `${path}/server`,
        env: {
          PORT: env.SERVER_PORT,
          mongoDbURL: env.mongoDbURL,
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
      url: `http://localhost:${env.UI_PORT}`,
      spawnCmd: 'npm',
      spawnArgs: ['run', 'serve'],
      spawnOptions: {
        cwd: `${path}/front`,
        env: {
          UI_PORT: env.UI_PORT,
          VITE_APP_API_URL: env.SERVER_URL
        }
      }
    },

    {
      label: 'Hello',
      description: 'Just Hello',
      groups: [groups.MISC, "Hello", "Hello World"],
      spawnCmd: 'echo',
      spawnArgs: ['hello'],
    },
    
    {
      label: 'World',
      description: 'All the world',
      groups: [groups.MISC, "World", "Hello World"],
      spawnCmd: 'echo',
      spawnArgs: ['world'],
    },
    
    {
      label: 'Mongo',
      groups: [groups.MISC],
      description: 'Just start the mongodb in docker',
      spawnCmd: 'docker',
      spawnArgs: ['start', 'mongo'],
    }, 
    
    {
      label: 'Multiple Commands',
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
