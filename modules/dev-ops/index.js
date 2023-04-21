/** @type {import('../views').PluginSM<null>} */
const plugin = {
  name: 'DevOps',
  icon: 'fas fa-hard-hat',
  export: null,
  placements: [{
    position: "sidebar",
    label: "DevOps",
    icon: "fas fa-hard-hat",
    goTo: { path: "/DevOps" },
    active: "DevOps",
  }],
}
module.exports = plugin