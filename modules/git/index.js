const commandExists = require('command-exists')

/** @type {import('../views').PluginSM<import('./Git')>} */
const plugin = {
  name: 'Git',
  icon: 'fab fa-git-alt',
  export: require('./Git'),
  placements: ['service', {
    position: "sidebar",
    label: "GIT",
    icon: "fab fa-git-alt",
    goTo: { path: "/Git-NotUpToDate" },
    active: "Git-NotUpToDate",
  }],
  order: 1,
  hidden: () => commandExists('git').then(() => false).catch(() => true),
  routes: require('./routes'),
}
module.exports = plugin