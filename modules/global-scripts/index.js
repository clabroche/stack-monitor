const GlobalScripts = require('./GlobalScripts');

/** @type {import('../views').PluginSM<GlobalScripts>} */
const plugin = {
  name: "Global scripts",
  icon: "fas fa-columns",
  export: GlobalScripts,
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