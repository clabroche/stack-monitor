/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<import('./JWT')>} */
const plugin = {
  enabled: true,
  name: 'JWT',
  displayName: 'JWT',
  description: 'Decode, verify and create JSON Web Tokens',
  icon: 'fas fa-key',
  export: require('./JWT'),
  placements: [
    {
      position: 'toolbox',
      label: 'JWT',
      icon: 'fas fa-key',
      goTo: { path: '/JWT' },
      active: 'JWT',
    },
  ],
  order: 6,
  routes: require('./routes'),
};

module.exports = plugin;
