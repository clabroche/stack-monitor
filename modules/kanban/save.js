const kanban = {
  /** @param {import('../../typings/export').StackMonitor} stackMonitor */
  getSave(stackMonitor) {
    return stackMonitor.getSave('kanban.json', {
      /** @type {Partial<import('../../typings').NonFunctionProperties<import('./Kanban').BoardType>['prototype']>[]} */
      boards: [],
      /** @type {Partial<import('../../typings').NonFunctionProperties<import('./Kanban').ColumnType>['prototype']>[]} */
      columns: [],
      /** @type {Partial<import('../../typings').NonFunctionProperties<import('./Kanban').CardType>['prototype']>[]} */
      cards: [],
    }, {
      afterGet(data) {
        if(!data.boards) data.boards = []
        if(!data.columns) data.columns = []
        if(!data.cards) data.cards = []
      },
      beforeSave(data) {
        if(!data.boards) data.boards = []
        if(!data.columns) data.columns = []
        if(!data.cards) data.cards = []
      }
    })
  }
}
module.exports = kanban