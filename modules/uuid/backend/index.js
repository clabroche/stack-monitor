/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<import('./UUID')>} */
const plugin = {
  enabled: true,
  name: 'UUID',
  displayName: 'UUID',
  description: 'Generate an UUID',
  icon: 'fas fa-random',
  placements: [
    {
      position: 'toolbox',
      label: 'UUID',
      icon: 'fas fa-random',
      goTo: { path: '/UUID' },
      active: 'UUID',
    },
  ],
  export: require('./UUID'),
  order: 6,
  routes: require('./routes'),
};

module.exports = plugin;
