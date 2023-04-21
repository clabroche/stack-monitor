/** @type {import('../views').PluginSM<null>} */
const plugin = {
  name: "Global scripts",
  icon: "fas fa-columns",
  export: null,
  placements: [
    {
      position: "dev-ops",
      label: "Global scripts",
      iconText: "{}",
      goTo: { path: "/GlobalScripts" },
      active: "GlobalScripts",
    },
  ],
  routes: require('./routes'),
};
module.exports = plugin