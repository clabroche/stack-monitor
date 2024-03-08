const commandExists = require('command-exists');

/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<import('./Git')>} */
const plugin = {
  name: 'Git',
  displayName: 'Git',
  description: 'View and manage git across whole projects',
  icon: 'fab fa-git-alt',
  export: require('./Git'),
  placements: ['service', {
    position: 'sidebar',
    label: 'GIT',
    icon: 'fab fa-git-alt',
    goTo: { path: '/Git-NotUpToDate' },
    active: 'Git-NotUpToDate',
  }],
  order: 2,
  hidden: (service, stack, placement) => {
    if (placement === 'sidebar') return commandExists('git').then(() => false).catch(() => true);
    if (placement === 'service' && !service) return true;
    return true;
  },
  routes: require('./routes'),
};
module.exports = plugin;
