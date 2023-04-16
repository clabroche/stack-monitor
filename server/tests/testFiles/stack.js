const path = __dirname
const pathfs = require('path')

const groups = {
  API: 'api',
  UI: 'ui',
  MISC: 'misc'
}

/** @type {import('../../models/stack').StackObject} */
const stack = {
  watchFiles: [
    pathfs.resolve(__dirname, '.env')
  ],
  services: require('./services')
}

module.exports = stack