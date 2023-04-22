/** @type {import('../views').PluginSM<null>} */
const plugin = {
  name: "JWT",
  icon: "fas fa-key",
  export: null,
  placements: [
    {
      position: "toolbox",
      label: "JWT",
      icon: "fas fa-key",
      goTo: { path: "/JWT" },
      active: "JWT",
    },
  ],
  order: 6,
  routes: require('./routes'),
};
module.exports = plugin