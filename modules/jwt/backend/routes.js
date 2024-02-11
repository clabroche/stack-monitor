const express = require('express');
const jsonwebtoken = require('jsonwebtoken');

const router = express.Router();

module.exports = () => {
  router.post('/JWT/', async (req, res) => {
    const { jwt } = req.body;
    res.json(jsonwebtoken.decode(jwt));
  });
  return router;
};
