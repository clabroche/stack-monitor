/** @type {import('../views').PluginSM<null>} */
const plugin = {
  name: 'Toolbox',
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