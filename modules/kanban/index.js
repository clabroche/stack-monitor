/** @type {import('../views').PluginSM<import('./UUID')>} */
const plugin = {
  name: "kanban",
  displayName: 'Kanban',
  description: 'Manage your project with cards',
  icon: "fas fa-random",
  placements: [
    {
      position: "toolbox",
      label: "Kanban",
      icon: "fas fa-random",
      goTo: { path: "/kanban" },
      active: "kanban",
    },
  ],
  export: require('./Kanban'),
  order: 6,
  routes: require('./routes')
};

module.exports = plugin