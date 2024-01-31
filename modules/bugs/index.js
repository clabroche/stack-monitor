const fse = require('fs-extra')
const pathfs = require('path')

/** @type {import('../views').PluginSM<null>} */
const plugin = {
  name: 'Bugs',
  displayName: 'Bugs',
  description: 'Find bugs across a whole javascript project',
  icon: 'fas fa-bug',
  placements: ['service'],
  order: 4,
  export: null,
  hidden: async (service) => {
    if(!service) return true
    const serviceIsNpm = await isNpm(service)
    return !serviceIsNpm
  },
  routes: require('./routes')
}
module.exports = plugin

/** @param {import('../../server/models/Service')} service*/
async function isNpm (service) {
  const path = service?.spawnOptions?.cwd
  return path 
    ? fse.existsSync(pathfs.resolve(path.toString(), 'package.json'))
    : false
}