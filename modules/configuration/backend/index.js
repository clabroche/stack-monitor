/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<null>} */
const plugin = {
  enabled: true,
  name: 'Configuration',
  displayName: 'Configuration',
  description: 'Show all configurations used to launch the given service',
  icon: 'fas fa-cog',
  export: null,
  placements: ['service'],
  order: 5,
};
module.exports = plugin;
