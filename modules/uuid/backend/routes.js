const express = require('express');

const router = express.Router();
const UUID = require('./UUID');

/** @param {import('@clabroche/common-typings').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  const uuid = UUID(stackMonitor);
  router.get('/uuid/', async (req, res) => {
    const { count, noDash, uppercase } = req.query;
    res.json(uuid.generate({
      count: count ? parseInt(count, 10) : undefined,
      noDash: noDash === 'true',
      uppercase: uppercase === 'true'
    }));
  });
  return router;
};
