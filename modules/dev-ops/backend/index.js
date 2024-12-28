/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<null>} */
const plugin = {
  enabled: false,
  name: 'DevOps',
  displayName: 'Dev ops',
  description: 'Choose a tool used for dev ops purposes',
  icon: 'fas fa-hard-hat',
  order: 7,
  export: null,
  placements: [{
    position: 'sidebar',
    label: 'DevOps',
    icon: 'fas fa-hard-hat',
    goTo: { path: '/DevOps' },
    active: 'DevOps',
  }],
};
module.exports = plugin;
