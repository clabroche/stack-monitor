const kanban = {
  /** @param {import('@clabroche/common-typings').StackMonitor} stackMonitor */
  getSave(stackMonitor) {
    return stackMonitor.getSave('kanban.json', {
      /** @type {Partial<import('@clabroche/common-typings').NonFunctionProperties<import('./Kanban').BoardType>['prototype']>[]} */
      boards: [],
      /** @type {Partial<import('@clabroche/common-typings').NonFunctionProperties<import('./Kanban').ColumnType>['prototype']>[]} */
      columns: [],
      /** @type {Partial<import('@clabroche/common-typings').NonFunctionProperties<import('./Kanban').CardType>['prototype']>[]} */
      cards: [],
    }, {
      afterGet(data) {
        if (!data.boards) data.boards = [];
        if (!data.columns) data.columns = [];
        if (!data.cards) data.cards = [];
      },
      beforeSave(data) {
        if (!data.boards) data.boards = [];
        if (!data.columns) data.columns = [];
        if (!data.cards) data.cards = [];
      },
    });
  },
};
module.exports = kanban;
