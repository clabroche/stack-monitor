/** @type {import('../views').PluginSM<null>} */
const plugin = {
  name: 'Logs',
  displayName: 'Logs',
  description: 'Show, parse and communicate with logs produced by yours commands',
  icon: 'fas fa-terminal',
  export: null,
  placements: ['service'],
  order: 1,
  routes: require('./routes')
}
module.exports = plugin
