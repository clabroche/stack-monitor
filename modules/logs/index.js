/** @type {import('../views').PluginSM<null>} */
const plugin = {
  name: 'Logs',
  icon: 'fas fa-terminal',
  export: null,
  placements: ['service'],
  order: 2,
  routes: require('./routes')
}
module.exports = plugin
