const Workflows = require('./Workflows');

/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<Workflows>} */
const plugin = {
  enabled: true,
  name: 'Workflows',
  displayName: 'Workflows',
  description: 'Make workflows based on events or manual triggers',
  icon: 'fas fa-sitemap',
  export: Workflows,
  order: 10,
  placements: [
    {
      position: 'sidebar-top',
      label: 'Workflows',
      icon: 'fas fa-sitemap',
      goTo: { path: '/Workflows' },
      active: 'Workflows',
    },
  ],
  finder: (search, stackMonitor) => {
    return []
  },
  routes: require('./routes'),
};
module.exports = plugin;
