const express = require('express');

const router = express.Router();
const { v4 } = require('uuid');

module.exports = () => {
  router.get('/diff', async (req, res) => {
    res.json(v4());
  });
  return router;
};
