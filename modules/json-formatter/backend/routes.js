const express = require('express');
const router = express.Router();
const JSONFormatter = require('./JSONFormatter');

/**
 * Route handler for JSON formatter enhanced features
 * @param {import('../../../../servers/server/models/stack')} stackMonitor - Stack monitor instance
 * @returns {import('express').Router} Express router
 */
module.exports = function(stackMonitor) {
  // Validate JSON schema
  router.post('/JSONFormatterEnhanced/validate', (req, res) => {
    try {
      const { json, schema } = req.body;
      const result = JSONFormatter.validateSchema(json, schema);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Convert JSON to YAML
  router.post('/JSONFormatterEnhanced/to-yaml', (req, res) => {
    try {
      const { json } = req.body;
      const yaml = JSONFormatter.jsonToYaml(json);
      res.json({ yaml });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Convert YAML to JSON
  router.post('/JSONFormatterEnhanced/from-yaml', (req, res) => {
    try {
      const { yaml } = req.body;
      const json = JSONFormatter.yamlToJson(yaml);
      res.json({ json });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Convert JSON to XML
  router.post('/JSONFormatterEnhanced/to-xml', (req, res) => {
    try {
      const { json } = req.body;
      const xml = JSONFormatter.jsonToXml(json);
      res.json({ xml });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Convert XML to JSON
  router.post('/JSONFormatterEnhanced/from-xml', (req, res) => {
    try {
      const { xml } = req.body;
      const json = JSONFormatter.xmlToJson(xml);
      res.json({ json });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get statistics for JSON
  router.post('/JSONFormatterEnhanced/stats', (req, res) => {
    try {
      const { json } = req.body;
      const stats = JSONFormatter.getJsonStats(json);
      res.json(stats);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Query JSON using JSONPath
  router.post('/JSONFormatterEnhanced/query', (req, res) => {
    try {
      const { json, query } = req.body;
      const results = JSONFormatter.queryJson(json, query);
      res.json(results);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  return router;
}; 