const path = __dirname
let BASE = "espace-des-marques"

const stack = [
  {
    label: 'Server',
    description: 'This is the backend of an unbelievable project',
    git: {
      home: 'https://<an-awesome-url>',
      remote: 'git@github.com:<your-beautiful-profile>/<your-excellent-project>.git'
    },
    url: 'http://localhost:3010',
    spawnCmd: 'npm',
    spawnArgs: ['run', 'serve'],
    spawnOptions: {
      cwd: `${path}/server`,
      env: Object.assign({
        PORT: "3010",
        mongoDbURL: `mongodb://root:123456@localhost:27017/${BASE}?authSource=admin`,
      }, process.env)
    }
  }, {
    label: 'Hello',
    description: 'Just Hello',
    groups: ["Hello", "Hello World"],
    spawnCmd: 'echo',
    spawnArgs: ['hello'],
  }, {
    label: 'World',
    description: 'All the world',
    groups: ["World", "Hello World"],
    spawnCmd: 'echo',
    spawnArgs: ['world'],
  }, {
    label: 'Mongo',
    description: 'Just start the mongodb in docker',
    spawnCmd: 'docker',
    spawnArgs: ['start', 'mongo'],
  }, {
    label: 'Multiple Commands',
    description: 'Launch multiple commands at once',
    commands: [{
      spawnCmd: 'echo',
      spawnArgs: ['coucou1'],
    }, {
        spawnCmd: 'echo',
        spawnArgs: ['coucou2'],
      }]
  },
  {
    label: 'Front',
    description: 'This is the front of an unbelievable project',
    git: {
      home: 'https://<an-awesome-url>',
      remote: 'git@github.com:<your-beautiful-profile>/<your-excellent-project>.git'
    },
    url: 'http://localhost:8080',
    spawnCmd: 'npm',
    spawnArgs: ['run', 'serve'],
    spawnOptions: {
      cwd: `${path}/front`,
      env: Object.assign({
        VUE_APP_API_URL: "http://localhost:3010"
      }, process.env)
    }
  },
]
module.exports = stack
