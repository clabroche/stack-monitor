/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<import('./HttpClient')>} */
const plugin = {
  enabled: true,
  name: 'HttpClient',
  displayName: 'HTTP Client',
  description: 'Test HTTP endpoints like Postman',
  icon: 'fas fa-exchange-alt',
  placements: [
    {
      position: 'toolbox',
      label: 'HTTP Client',
      icon: 'fas fa-exchange-alt',
      goTo: { path: '/HttpClient' },
      active: 'HttpClient',
    },
  ],
  export: require('./HttpClient'),
  order: 7,
  routes: require('./routes'),
};

module.exports = plugin; 