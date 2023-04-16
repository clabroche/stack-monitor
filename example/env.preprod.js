const { cloneDeep } = require('lodash')
const local = require('./env.local')
const envs = cloneDeep(local);

envs.SERVER_PORT = 3010
envs.SERVER_URL = `http://localhost:${envs.SERVER_PORT}`

module.exports = envs