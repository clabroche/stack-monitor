const express = require('express');
const JWT = require('./JWT');

const router = express.Router();

module.exports = () => {
  // Decode JWT token
  router.post('/JWT/', async (req, res) => {
    const { jwt } = req.body;
    try {
      res.json(JWT.decode(jwt));
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Analyze JWT token structure and details
  router.post('/JWT/analyze', async (req, res) => {
    const { jwt } = req.body;
    try {
      res.json(JWT.analyze(jwt));
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Verify JWT signature
  router.post('/JWT/verify', async (req, res) => {
    const { jwt, secret, options } = req.body;
    try {
      res.json(JWT.verify(jwt, secret, options));
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Generate a new JWT
  router.post('/JWT/generate', async (req, res) => {
    const { payload, secret, options } = req.body;
    try {
      const token = JWT.generate(payload, secret, options);
      res.json({ token });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  return router;
};
