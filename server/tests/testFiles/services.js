const path = __dirname

const groups = {
  API: 'api',
  UI: 'ui',
  MISC: 'misc'
}

/** @type {import('../../models/stack').StackArray} */
const services = [
  {
    label: 'Server',
    description: 'This is the backend of an unbelievable project',
    groups: [groups.API],
    documentation: path + '/documentation/server',
    git: {
      home: 'https://<an-awesome-url>',
      remote: 'git@github.com:<your-beautiful-profile>/<your-excellent-project>.git'
    },
    url: `http://localhost:3000`,
    spawnCmd: 'echo',
    spawnArgs: ['server', '$PORT', '$mongoDbURL'],
    spawnOptions: {
      cwd: __dirname,
      env: {
        PORT: process.env.SERVER_PORT,
        mongoDbURL: process.env.mongoDbURL,
      }
    }
  },
  {
    label: 'Front',
    spawnCmd: 'echo',
    spawnArgs: ['Front', '$PORT', '$mongoDbURL'],
    spawnOptions: {
      cwd: __dirname,
      env: {
        PORT: process.env.SERVER_PORT,
        mongoDbURL: process.env.mongoDbURL,
      }
    }
  },
]

module.exports = services