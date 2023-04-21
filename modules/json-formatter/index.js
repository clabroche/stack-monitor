/** @type {import('../views').PluginSM<null>} */
const plugin = {
  name: "JSONFormatter",
  icon: "fas fa-random",
  export: null,
  placements: [
    {
      position: "toolbox",
      label: "JSON",
      iconText: "{}",
      goTo: { path: "/JSONFormatter" },
      active: "JSON-formatter",
    },
  ],
  order: 6,
};
module.exports = plugin