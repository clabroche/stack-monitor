/** @type {import('@clabroche/modules-plugins-loader/views').PluginSM<null>} */
const plugin = {
  name: 'Configuration',
  displayName: 'Configuration',
  description: 'Show all configurations used to launch the given service',
  icon: 'fas fa-cog',
  export: null,
  placements: ['service'],
  order: 5,
}
module.exports = plugin