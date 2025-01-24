const { existsSync } = require('fs');
const pathfs = require('path');

/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<null>} */
const plugin = {
  enabled: true,
  name: 'Bugs',
  displayName: 'Bugs',
  description: 'Find bugs across a whole javascript project',
  icon: 'fas fa-bug',
  placements: ['service'],
  order: 4,
  export: null,
  hidden: async (service) => {
    if (!service) return true;
    const npm = new service.Stack.npm(service)
    const serviceIsNpm = !!npm.getNpmPaths(service);
    return !serviceIsNpm;
  },
  routes: require('./routes'),
};
module.exports = plugin;

