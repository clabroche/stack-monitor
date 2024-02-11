const express = require('express');
const { ObjectId } = require('mongodb');

const router = express.Router();

router.get('/mongo/generate', async (req, res) => {
  res.json(new ObjectId());
});

module.exports = () => router;
