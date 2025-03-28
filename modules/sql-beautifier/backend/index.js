/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<import('./SQLBeautifier')>} */
const plugin = {
  enabled: true,
  name: 'sqlbeautifier',
  displayName: 'SQL Beautifier',
  description: 'Format and beautify SQL queries with syntax highlighting and real-time updates',
  icon: 'fas fa-database',
  order: 8,
  export: require('./SQLBeautifier'),
  routes: require('./routes'),
  placements: [
    {
      position: 'toolbox',
      label: 'SQL Beautifier',
      icon: 'fas fa-database',
      goTo: { path: '/SQLBeautifier' },
      active: 'SQLBeautifier',
    }
  ]
};

module.exports = plugin; 