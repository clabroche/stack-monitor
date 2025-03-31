const express = require('express');
const router = express.Router();
const HttpClient = require('./HttpClient');

/** @param {import('@clabroche/common-typings').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  const httpClient = HttpClient(stackMonitor);
  
  router.post('/http-client/request', async (req, res) => {
    try {
      const { method, url, headers, body, params } = req.body;
      const response = await httpClient.sendRequest({
        method,
        url,
        headers,
        body,
        params
      });
      res.json(response);
    } catch (error) {
      res.status(500).json({ 
        error: true, 
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });

  router.get('/http-client/history', (req, res) => {
    // In a real implementation, this would fetch from a persistent store
    res.json([]);
  });

  router.post('/http-client/history', (req, res) => {
    // In a real implementation, this would save to a persistent store
    res.json({ success: true });
  });

  return router;
}; 