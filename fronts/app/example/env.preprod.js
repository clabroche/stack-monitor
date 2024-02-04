const local = require('./env.local')

const SERVER_PORT = '3010'

module.exports = {
  ...local,
  SERVER_PORT,
  SERVER_URL: `http://localhost:${SERVER_PORT}`
}