/* eslint-disable max-classes-per-file */
const { v4 } = require('uuid');
const { getSave: _getSave } = require('./save');

/** @type {import('@clabroche/common-typings').StackMonitor | null} */
let stackMonitor = null;

function getSave() {
  if (!stackMonitor) throw new Error('Call init before');
  const { data, save } = _getSave(stackMonitor);
  return { data, save };
}

/** @param {import('@clabroche/common-typings').StackMonitor} stackMonitor */
class Board {
  /** @param {Partial<import('@clabroche/common-typings').NonFunctionProperties<Board>>} board */
  constructor(board = {}) {
    /** @type {string} */
    this.id = board.id || v4();
    /** @type {string | undefined} */
    this.name = board.name;
    /** @type {string[]} */
    this.columnIds = board.columnIds || [];
  }

  /** @returns {Board[]} */
  static all() {
    const { data } = getSave();
    // @ts-ignore
    return data.boards.map((/** @type {*} */b) => (b ? new Board(b) : null)).filter((a) => a);
  }

  /** @param {string} id */
  static get(id) {
    const { data } = getSave();
    const board = data.boards.find((d) => d?.id === id);
    return board ? new Board(board) : null;
  }

  /**
   *
   * @returns {Column[]}
   */
  getColumns() {
    // @ts-ignore
    return this.columnIds.map((columnId) => Column.get(columnId)).filter((a) => a);
  }

  delete() {
    const { data, save } = getSave();
    this.getColumns().forEach((c) => c.delete());
    data.boards = data.boards.filter((b) => b?.id !== this.id);
    save();
  }

  /** @param {string} id */
  getColumn(id) {
    return this.getColumns().find((c) => c?.id === id);
  }

  /** @param {Partial<import('@clabroche/common-typings').NonFunctionProperties<Column>>} column */
  addColumn(column) {
    const savedColumn = new Column({ ...column, boardId: this.id }).save();
    this.columnIds = [...new Set([...this.columnIds, savedColumn.id])];
    this.save();
    return savedColumn;
  }

  save() {
    const { data, save } = getSave();
    const existing = data.boards.find((b) => b?.id === this.id);
    if (existing) {
      Object.assign(existing, { ...this });
    } else {
      data.boards.push(this);
    }
    save();
    return this;
  }
}

class Column {
  /** @param {Partial<import('@clabroche/common-typings').NonFunctionProperties<Column>>} column */
  constructor(column = {}) {
    /** @type {string} */
    this.id = column.id || v4();
    /** @type {string | undefined} */
    this.name = column.name;
    /** @type {string | undefined} */
    this.color = column.color;
    /** @type {string | undefined} */
    this.boardId = column.boardId;
    /** @type {string[]} */
    this.cardIds = column.cardIds || [];
  }

  /** @param {string} id */
  static get(id) {
    const { data } = getSave();
    const column = data.columns.find((d) => d?.id === id);
    return column ? new Column(column) : null;
  }

  /** @returns {Card[]} */
  getCards() {
    // @ts-ignore
    return this.cardIds.map((columnId) => Card.get(columnId)).filter((a) => a);
  }

  /** @param {string} id */
  getCard(id) {
    return this.getCards().find((c) => c?.id === id);
  }

  /** @param {Partial<import('@clabroche/common-typings').NonFunctionProperties<Card>>} card */
  addCard(card) {
    const savedColumn = new Card({ ...card, boardId: this.boardId, columnId: this.id }).save();
    this.cardIds = [...new Set([...this.cardIds, savedColumn.id])];
    this.save();
    return savedColumn;
  }

  delete() {
    const { data, save } = getSave();
    this.getCards().forEach((c) => c.delete());
    data.columns = data.columns.filter((b) => b?.id !== this.id);
    save();
  }

  save() {
    const { data, save } = getSave();
    const existing = data.columns.find((b) => b?.id === this.id);
    if (existing) {
      Object.assign(existing, { ...this });
    } else {
      data.columns.push(this);
    }
    save();
    return this;
  }
}

class Card {
  /** @param {Partial<import('@clabroche/common-typings').NonFunctionProperties<Card>>} card */
  constructor(card = {}) {
    /** @type {string} */
    this.id = card.id || v4();
    /** @type {string | undefined} */
    this.name = card.name;
    /** @type {string | undefined} */
    this.description = card.description;

    /** @type {string | undefined} */
    this.boardId = card.boardId;
    /** @type {string | undefined} */
    this.columnId = card.columnId;
  }

  /** @param {string} id */
  static get(id) {
    const { data } = getSave();
    const cards = data.cards.find((d) => d?.id === id);
    return cards ? new Card(cards) : null;
  }

  delete() {
    const { data, save } = getSave();
    data.cards = data.cards.filter((b) => b?.id !== this.id);
    save();
  }

  save() {
    const { data, save } = getSave();
    const existing = data.cards.find((b) => b?.id === this.id);
    if (existing) {
      Object.assign(existing, { ...this });
    } else {
      data.cards.push(this);
    }
    save();
    return this;
  }
}
/** @param {import('@clabroche/common-typings').StackMonitor} _stackMonitor */
const Kanban = (_stackMonitor) => {
  stackMonitor = _stackMonitor;
  return {
    Card,
    Column,
    Board,
  };
};

module.exports = Kanban;

/** @typedef {typeof Column} ColumnType */
/** @typedef {typeof Card} CardType */
/** @typedef {typeof Board} BoardType */
