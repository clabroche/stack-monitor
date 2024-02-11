/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<null>} */
const plugin = {
  name: 'Help',
  displayName: 'Help',
  description: 'Show help',
  icon: 'fa-question-circle',
  export: null,
  placements: [{
    position: 'sidebar',
    label: 'Help',
    icon: 'fas fa-question-circle',
    goTo: { path: '/Help' },
    active: 'Help',
  }],
  order: Infinity,
};
module.exports = plugin;
