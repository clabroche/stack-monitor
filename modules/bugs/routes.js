const express = require('express');
const router = express.Router();
const { findService } = require('../../server/models/stack')
const pathfs = require('path')
const {fork} = require('child_process')

router.get('/:service', async (req, res) => {
  const service = findService(req.params.service)
  if(!service) return res.status(404).send('SERVICE_NOT_FOUND')
  const ts = fork(pathfs.resolve(__dirname, '..', '..', 'server', 'helpers', 'checkJsFork'))
  ts.on('message', results => {
    res.json(results)
    ts.kill('SIGKILL')
  })
  ts.send(service.spawnOptions.cwd)
})
module.exports = router;