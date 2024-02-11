const express = require('express');

const router = express.Router();
const UUID = require('./UUID');

/** @param {import('@clabroche/fronts-app/typings/export').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  const uuid = UUID(stackMonitor);
  router.get('/uuid/', async (req, res) => {
    res.json(uuid.generate());
  });
  return router;
};
