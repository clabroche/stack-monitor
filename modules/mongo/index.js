/** @type {import('../views').PluginSM<null>} */
const plugin = {
  name: "Mongo",
  icon: "fab fa-envira",
  export: null,
  placements: [
    {
      position: "toolbox",
      label: "Mongo",
      icon: "fab fa-envira",
      goTo: { path: "/Mongo" },
      active: "Mongo",
    },
  ],
  order: 6,
  routes: require('./routes'),
};
module.exports = plugin

