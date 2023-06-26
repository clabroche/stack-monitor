const commandExists = require('command-exists')

/** @type {import('../views').PluginSM<null>} */
const plugin = {
  name: 'Finder',
  displayName: 'Finder',
  description: 'Find all you want inside this app',
  icon: 'fab fa-git-alt',
  export: null,
  order: -1,
  placements: ['global', {
    position: "sidebar",
    label: "Finder",
    icon: "fas fa-search",
    goTo: { path: "/Finder" },
    active: "Finder",
  }],
  hidden: () => commandExists('git').then(() => false).catch(() => true),
  routes: require('./routes'),
}
module.exports = plugin