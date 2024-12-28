/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<null>} */
const plugin = {
  enabled: true,
  name: 'Mongo',
  displayName: 'Mongo',
  description: 'Make some operation on mongo objectid',
  icon: 'fab fa-envira',
  export: null,
  placements: [
    {
      position: 'toolbox',
      label: 'Mongo',
      icon: 'fab fa-envira',
      goTo: { path: '/Mongo' },
      active: 'Mongo',
    },
  ],
  order: 6,
  routes: require('./routes'),
};
module.exports = plugin;
