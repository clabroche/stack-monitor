const Kanban = require('./Kanban');

/** @type {import('@clabroche/modules-plugins-loader-front/src/views').PluginSM<import('./Kanban')>} */
const plugin = {
  name: 'kanban',
  displayName: 'Kanban',
  description: 'Manage your project with cards',
  icon: 'fas fa-columns',
  placements: [
    {
      position: 'toolbox',
      label: 'Kanban',
      icon: 'fas fa-columns',
      goTo: { path: '/kanban' },
      active: 'kanban',
    },
  ],
  finder: (/** @type {*} */search, /** @type {*} */stackMonitor) => {
    const boards = Kanban(stackMonitor).Board.all().filter((board) => (
      stackMonitor.helpers.searchString(board?.name || '', search)
    ));
    const cards = Kanban(stackMonitor).Board.all()
      .flatMap((b) => b?.getColumns())
      ?.flatMap((c) => c?.getCards())
      ?.filter((board) => (
        stackMonitor.helpers.searchString(board?.name || '', search)
      ));
    return [
      ...boards.map((board) => ({
        icon: 'fas fa-columns',
        title: board?.name || '',
        group: 'Kanban',
        description: 'Manage your project with cards',
        secondaryTitle: 'Board',
        url: { path: '/toolbox/kanban', query: { boardId: board?.id } },
      })),
      ...cards.map((card) => ({
        icon: 'fas fa-columns',
        title: card?.name || '',
        group: 'Kanban',
        description: 'Manage your project with cards',
        secondaryTitle: 'Card',
        url: { path: '/toolbox/kanban', query: { boardId: card?.boardId, cardId: card?.id } },
      })),
    ];
  },
  export: Kanban,
  order: 6,
  routes: require('./routes'),
};

module.exports = plugin;
