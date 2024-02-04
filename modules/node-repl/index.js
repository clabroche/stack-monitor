/** @type {import('@clabroche/modules-plugins-loader/views').PluginSM<null>} */
const plugin = {
  name: "NodeREPL",
  displayName: "Node REPL",
  description: "Create nodejs scripts for test purposes",
  icon: "fab fa-node",
  export: null,
  placements: [
    {
      position: "toolbox",
      label: "Node Sandbox",
      icon: "fab fa-node",
      goTo: { path: "/NodeREPL" },
      active: "NodeREPL",
    },
  ],
  order: 6,
  routes: require('./routes'),
};
module.exports = plugin

