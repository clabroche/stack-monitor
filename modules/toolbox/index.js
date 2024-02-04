/** @type {import('@clabroche/modules-plugins-loader/views').PluginSM<null>} */
const plugin = {
  name: 'Toolbox',
  displayName: 'Toolbox',
  description: 'Choose from a bunch of tool',
  icon: 'fas fa-plus',
  export: null,
  placements: [{
    position: 'sidebar',
    label: 'Toolbox',
    icon: 'fas fa-toolbox',
    goTo: '/toolbox',
    active: 'toolbox',
  }],
  order: 6,
}
module.exports = plugin