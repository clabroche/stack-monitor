/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<null>} */
const plugin = {
  name: 'Docker',
  displayName: 'Docker',
  description: 'Show docker configs',
  icon: 'fab fa-docker',
  export: null,
  placements: ['service'],
  order: 4,
  /** @param {import('../../../servers/server/models/Service') | null} service */
  hidden: async (service) => {
    if (!service?.container) return true;
    return !service.container.enabled;
  },
  routes: require('./routes'),
};
module.exports = plugin;
