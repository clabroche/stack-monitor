/** @type {import('@clabroche/modules-plugins-loader/views').PluginSM<null>} */
const plugin = {
  name: "JSONFormatter",
  displayName: "Json Formatter",
  description: 'View json validity and explore it',
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