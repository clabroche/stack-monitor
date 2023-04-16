/** @type {import('../views').PluginSM} */
const plugin = {
  name: "Regex",
  icon: "fas fa-key",
  placements: [
    {
      position: "toolbox",
      label: "Regex",
      icon: "fas fa-key",
      goTo: { path: "/Regex" },
      active: "Regex",
    },
  ],
  order: 6,
};
module.exports = plugin