const express = require('express');
const MongoDB = require('./Mongo');

const router = express.Router();

router.get('/mongo/generate', async (req, res) => {
  res.json(MongoDB.generateObjectId());
});

router.post('/mongo/validate', async (req, res) => {
  const { objectId } = req.body;
  res.json({
    isValid: MongoDB.isValidObjectId(objectId)
  });
});

router.post('/mongo/decode', async (req, res) => {
  const { objectId } = req.body;
  res.json(MongoDB.decodeObjectId(objectId));
});

router.post('/mongo/from-date', async (req, res) => {
  const { date } = req.body;
  res.json({
    objectId: MongoDB.objectIdFromDate(date)
  });
});

router.post('/mongo/compare', async (req, res) => {
  const { objectId1, objectId2 } = req.body;
  res.json(MongoDB.compareObjectIds(objectId1, objectId2));
});

router.post('/mongo/test-connection', async (req, res) => {
  const { connectionString } = req.body;
  try {
    const result = await MongoDB.testConnection(connectionString);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

module.exports = () => router;
