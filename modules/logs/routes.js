const express = require('express');
const router = express.Router();

/** @param {import('../../typings/index').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  const { findService, Socket } = stackMonitor
  router.get('/logs/:service/logs', function (req, res) {
    const service = findService(req.params.service)
    res.send(service ? service.store : '')
  });
  router.delete('/logs/:service/logs', function (req, res) {
    const service = findService(req.params.service)
    service.store = ''
    Socket.io?.emit('logs:clear', { label: service.label })
    res.send(service.store)
  });
  return router
}