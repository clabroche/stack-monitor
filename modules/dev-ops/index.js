/** @type {import('../views').PluginSM} */
const plugin = {
  name: 'DevOps',
  icon: 'fas fa-hard-hat',
  placements: [{
    position: "sidebar",
    label: "DevOps",
    icon: "fas fa-hard-hat",
    goTo: { path: "/DevOps" },
    active: "DevOps",
  }],
}
module.exports = plugin