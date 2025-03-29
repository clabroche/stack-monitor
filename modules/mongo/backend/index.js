/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<null>} */
const plugin = {
  enabled: true,
  name: 'Mongo',
  displayName: 'MongoDB',
  description: 'MongoDB toolkit with ObjectID operations, validation, comparison and connection testing',
  icon: 'fab fa-envira',
  export: null,
  placements: [
    {
      position: 'toolbox',
      label: 'MongoDB',
      icon: 'fab fa-envira',
      goTo: { path: '/Mongo' },
      active: 'Mongo',
    },
  ],
  order: 6,
  routes: require('./routes'),
};
module.exports = plugin;
