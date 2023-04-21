/** @type {import('../views').PluginSM<import('./UUID')>} */
const plugin = {
  name: "UUID",
  icon: "fas fa-random",
  placements: [
    {
      position: "toolbox",
      label: "UUID",
      icon: "fas fa-random",
      goTo: { path: "/UUID" },
      active: "UUID",
    },
  ],
  export: require('./UUID'),
  order: 6,
  routes: require('./routes')
};

module.exports = plugin