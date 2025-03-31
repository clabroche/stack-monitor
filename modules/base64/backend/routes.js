const express = require('express');
const router = express.Router();
const Base64 = require('./Base64');

/** @param {import('@clabroche/common-typings').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  const base64 = Base64(stackMonitor);
  
  router.post('/base64/encode', (req, res) => {
    try {
      const { value } = req.body;
      const result = base64.encode(value);
      res.json({ result });
    } catch (error) {
      res.status(500).json({ 
        error: true, 
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.post('/base64/decode', (req, res) => {
    try {
      const { value } = req.body;
      const result = base64.decode(value);
      res.json({ result });
    } catch (error) {
      res.status(500).json({ 
        error: true, 
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}; 