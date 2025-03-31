/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<import('./Base64')>} */
const plugin = {
  enabled: true,
  name: 'Base64',
  displayName: 'Base64',
  description: 'Encode and decode Base64 strings',
  icon: 'fas fa-exchange-alt',
  placements: [
    {
      position: 'toolbox',
      label: 'Base64',
      icon: 'fas fa-exchange-alt',
      goTo: { path: '/Base64' },
      active: 'Base64',
    },
  ],
  export: require('./Base64'),
  order: 8,
  routes: require('./routes'),
};

module.exports = plugin; 