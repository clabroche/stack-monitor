const Npm = require('./Npm')

/** @type {import('../views').PluginSM<null>} */
const plugin = {
  name: 'Npm',
  displayName: 'Npm',
  description: 'View your dependencies and execute your scripts on a service',
  icon: 'fab fa-npm',
  export: null,
  placements: ['service'],
  order: 4,
  /**
   * 
   * @param {import('../../server/models/Service')} service 
   * @returns 
   */
  hidden: async (service) => {
    if(!service) return false;
    const project = new Npm(service)
    const serviceIsNpm = await project.isNpm()
    return !serviceIsNpm
  },
  routes: require('./routes')
}
module.exports = plugin

/**
 * @typedef {Record<string, {
 *   "current": string,
 *   "wanted": string,
 *   "latest": string,
 *   "dependent": string,
 *   "location": string,
 * }>} Outdated
 */