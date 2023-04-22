const Npm = require('./Npm')

/** @type {import('../views').PluginSM<null>} */
const plugin = {
  name: 'Npm',
  icon: 'fab fa-npm',
  export: null,
  placements: ['service'],
  order: 3,
  /**
   * 
   * @param {import('../../server/models/Service')} service 
   * @returns 
   */
  hidden: async (service) => {
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