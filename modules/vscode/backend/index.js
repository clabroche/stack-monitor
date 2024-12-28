const commandExists = require('command-exists');

/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<null>} */
const plugin = {
  enabled: true,
  name: 'Vscode',
  displayName: 'Vscode',
  description: 'interact with vscode extension',
  icon: 'fab fa-git-alt',
  export: null,
  order: Infinity,
  placements: [{
    position: 'sidebar',
    label: 'VScode extension',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Visual_Studio_Code_1.35_icon.svg/512px-Visual_Studio_Code_1.35_icon.svg.png',
    goTo: { path: '/Vscode' },
    active: 'Vscode',
  }],
  hidden: () => commandExists('code').then(() => false).catch(() => true),
  routes: require('./routes'),
};
module.exports = plugin;
