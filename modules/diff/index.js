/** @type {import('../views').PluginSM<null>} */
const plugin = {
  name: "Diff",
  displayName: 'Differences',
  description: 'Find differences between two strings',
  icon: "fas fa-columns",
  export: null,
  placements: [
    {
      position: "toolbox",
      label: "Diff",
      icon: "fas fa-columns",
      goTo: { path: "/Diff" },
      active: "Diff",
    },
  ],
  order: 6,
  routes: require('./routes'),
};
module.exports = plugin