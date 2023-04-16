/** @type {import('../views').PluginSM} */
const plugin = {
  name: "JSONFormatter",
  icon: "fas fa-random",
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