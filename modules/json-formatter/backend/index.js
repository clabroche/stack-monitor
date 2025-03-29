/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<import('./JSONFormatter')>} */
const plugin = {
  enabled: true,
  name: 'JSONFormatter',
  displayName: 'JSON',
  description: 'View, edit, validate, transform and explore JSON data',
  icon: 'fas fa-brackets-curly',
  export: require('./JSONFormatter'),
  placements: [
    {
      position: 'toolbox',
      label: 'JSON',
      iconText: '{}',
      goTo: { path: '/JSONFormatter' },
      active: 'JSONFormatter',
    },
  ],
  routes: require('./routes'),
  order: 6,
};
module.exports = plugin; 