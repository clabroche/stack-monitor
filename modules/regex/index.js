/** @type {import('../views').PluginSM<null>} */
const plugin = {
  name: "Regex",
  icon: "fas fa-key",
  export: null,
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