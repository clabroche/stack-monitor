const express = require('express');
const beautifier = require('./SQLBeautifier');

/**
 * @param {import('../../../../servers/server/models/stack')} stackMonitor
 * @returns {import('express').Router}
 */
function routes(stackMonitor) {
  const router = express.Router();

  /**
   * @typedef {Object} BeautifyRequest
   * @property {string} sql - The SQL query to beautify
   */

  router.post('/sqlbeautifier/beautify', (req, res) => {
    const { sql } = req.body;

    // Validate request body
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ 
        error: 'SQL query must be a non-empty string' 
      });
    }

    try {
      const result = beautifier.beautify(sql);
      res.json(result);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred while beautifying SQL';
      
      res.status(500).json({ error: errorMessage });
    }
  });

  return router;
}

module.exports = routes; 