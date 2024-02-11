/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<null>} */
const plugin = {
  name: 'JWT',
  displayName: 'JWT',
  description: 'View a json web token',
  icon: 'fas fa-key',
  export: null,
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
