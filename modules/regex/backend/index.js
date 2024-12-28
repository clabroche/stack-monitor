/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<null>} */
const plugin = {
  enabled: true,
  name: 'Regex',
  displayName: 'Regex',
  description: 'Test your regular expression',
  icon: 'fas fa-key',
  export: null,
  placements: [
    {
      position: 'toolbox',
      label: 'Regex',
      icon: 'fas fa-key',
      goTo: { path: '/Regex' },
      active: 'Regex',
    },
  ],
  order: 6,
};
module.exports = plugin;
