/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<null>} */
const plugin = {
  enabled: true,
  name: 'Github',
  displayName: 'Github',
  description: 'View pull requests for a given service',
  icon: 'fab fa-github',
  export: null,
  placements: ['service'],
  order: 3,
  /** @param {import('../../../servers/server/models/Service')} service */
  hidden: async (service) => {
    if (!service) return true;
    return !service.git?.remote?.includes('github.com');
  },
  routes: require('./routes'),
};
module.exports = plugin;
