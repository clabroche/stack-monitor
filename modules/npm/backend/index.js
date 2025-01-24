const Npm = require('./Npm');

/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<null>} */
const plugin = {
  enabled: true,
  name: 'Npm',
  displayName: 'Npm',
  description: 'View your dependencies and execute your scripts on a service',
  icon: 'fab fa-npm',
  export: null,
  placements: ['service'],
  order: 4,
  /**
   *
   * @param {import('../../../servers/server/models/Service')} service
   * @returns
   */
  hidden: async (service) => {
    if (!service) return false;
    const project = new Npm(service);
    const serviceIsNpm = !!project.getNpmPaths().length;
    return !serviceIsNpm;
  },
  routes: require('./routes'),
};
module.exports = plugin;

/**
 * @typedef {Record<string, {
 *   "current": string,
 *   "wanted": string,
 *   "latest": string,
 *   "dependent": string,
 *   "location": string,
 * }>} Outdated
 */
