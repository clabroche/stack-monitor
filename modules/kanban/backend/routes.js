const express = require('express');

const router = express.Router();

/** @param {import('@clabroche/fronts-app/typings/export').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  const { Board } = require('./Kanban')(stackMonitor);

  router.get('/kanban/boards', async (req, res) => {
    res.json(Board.all());
  });
  router.post('/kanban/boards', async (req, res) => {
    const board = new Board(req.body).save();
    res.json(board);
  });
  router.delete('/kanban/boards/:boardId', async (req, res) => {
    const board = Board.get(req.params.boardId);
    board?.delete();
    res.json(board);
  });

  router.get('/kanban/boards/:boardId/columns', async (req, res) => {
    res.json(Board.get(req.params.boardId)?.getColumns());
  });
  router.get('/kanban/boards/:boardId/columns/:columnId', async (req, res) => {
    res.json(Board.get(req.params.boardId)?.getColumn(req.params.columnId));
  });
  router.delete('/kanban/boards/:boardId/columns/:columnId', async (req, res) => {
    const column = Board.get(req.params.boardId)?.getColumn(req.params.columnId);
    column?.delete();
    res.json(column);
  });
  router.post('/kanban/boards/:boardId/columns', async (req, res) => {
    const board = Board.get(req.params.boardId)?.addColumn(req.body);
    res.json(board);
  });

  router.get('/kanban/boards/:boardId/columns/:columnId/cards', async (req, res) => {
    res.json(Board.get(req.params.boardId)?.getColumn(req.params.columnId)?.getCards());
  });
  router.delete('/kanban/boards/:boardId/columns/:columnId/cards/:cardId', async (req, res) => {
    const card = Board.get(req.params.boardId)?.getColumn(req.params.columnId)?.getCard(req.params.cardId);
    card?.delete();
    res.json(card);
  });
  router.post('/kanban/boards/:boardId/columns/:columnId/cards', async (req, res) => {
    res.json(Board.get(req.params.boardId)?.getColumn(req.params.columnId)?.addCard(req.body));
  });
  return router;
};
