const express = require('express');
const pathfs = require('path');

const router = express.Router();

/** @param {import('@clabroche/common-typings').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  const { findService } = stackMonitor;

  /** @param {import('@clabroche/common-typings').Service} service */
  function getDocumentationPath(service) {
    const pathToDocumentation = service?.documentation || stackMonitor.getStack()?.documentation;
    return pathToDocumentation
      ? pathfs.resolve(pathToDocumentation)
      : null;
  }

  router.get('/documentation/service/:label', async (req, res) => {
    const service = findService(req.params.label);
    const documentationPath = getDocumentationPath(service);
    if (!documentationPath) return res.status(400).send('Documentation path not found');
    const dir = await stackMonitor.documentation.getTree(req.query.path?.toString() || '', documentationPath);
    return res.json(dir);
  });
  router.get('/documentation/service/:label/is-available', async (req, res) => {
    const service = findService(req.params.label);
    const documentationPath = getDocumentationPath(service);
    if (!documentationPath) return res.json(false);
    return res.json(true);
  });
  router.get('/documentation/service/:label/flat', async (req, res) => {
    const service = findService(req.params.label);
    const documentationPath = getDocumentationPath(service);
    if (!documentationPath) return res.status(400).send('Documentation path not found');
    const dir = await stackMonitor.documentation.getFlatFiles(req.query.path?.toString() || '', documentationPath);
    return res.json(dir);
  });

  router.get('/documentation/service/:label/:path', async (req, res) => {
    const service = findService(req.params.label);
    const documentationPath = getDocumentationPath(service);
    if (!documentationPath) return res.status(400).send('Documentation path not found');
    const file = await stackMonitor.documentation.readFile(req.params.path, documentationPath);
    return res.send(file);
  });
  router.post('/documentation/service/:label/:path', async (req, res) => {
    const service = findService(req.params.label);
    const documentationPath = getDocumentationPath(service);
    if (!documentationPath) return res.status(400).send('Documentation path not found');
    const file = await stackMonitor.documentation.writeFile(req.params.path, documentationPath, req.body.page);
    return res.send(file);
  });
  return router;
};
