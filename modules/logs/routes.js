const express = require('express');
const router = express.Router();
const {findService} = require('../../server/models/stack')
const Socket = require('../../server/models/socket');

router.get('/:service/logs', function (req, res) {
  const service = findService(req.params.service)
  res.send(service ? service.store : '')
});
router.delete('/:service/logs', function (req, res) {
  const service = findService(req.params.service)
  service.store = ''
  Socket.socket.emit('logs:clear', { label: service.label })
  res.send(service.store)
});
module.exports = router