const express = require('express');
const router = express.Router();
const pathfs = require('path')
const {fork} = require('child_process')

/** @param {import('../../typings/export').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  router.get('/bugs/:service', async (req, res) => {
    const service = stackMonitor.findService(req.params.service)
    if (!service) return res.status(404).send('SERVICE_NOT_FOUND')
    const ts = fork(pathfs.resolve(__dirname, 'checkJsFork'))
    ts.on('message', results => {
      res.json(results)
      ts.kill('SIGKILL')
    })
    ts.send(service.rootPath || __dirname)
  })
  return router
}