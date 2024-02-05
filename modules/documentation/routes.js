const express = require('express');
const router = express.Router();

/** @param {import('../../fronts/app/typings/export').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  const {findService} = stackMonitor

  router.get('/documentation/service/:label', async (req, res) => {
    const service = findService(req.params.label)
    const dir = await stackMonitor.documentation.getTree(req.query.path?.toString() || '', service)
    res.json(dir)
  })
  router.get('/documentation/service/:label/flat', async (req, res) => {
    const service = findService(req.params.label)
    const dir = await stackMonitor.documentation.getFlatFiles(req.query.path?.toString() || '', service)
    res.json(dir)
  })

  router.get('/documentation/service/:label/:path', async (req, res) => {
    const service = findService(req.params.label)
    const file = await stackMonitor.documentation.readFile(req.params.path, service)
    res.send(file)
  })
  router.post('/documentation/service/:label/:path', async (req, res) => {
    const service = findService(req.params.label)
    const file = await stackMonitor.documentation.writeFile(req.params.path, service, req.body.page)
    res.send(file)
  })
  return router
};