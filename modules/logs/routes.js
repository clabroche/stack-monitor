const express = require('express');
const router = express.Router();
const fse = require('fs-extra')
const pathfs = require('path')
const { existsSync, mkdirSync } = require('fs');
const homedir = require('os').homedir();
const confDir = pathfs.resolve(homedir, '.stack-monitor')

if (!existsSync(confDir)) mkdirSync(confDir)
const historyConfPath = pathfs.resolve(confDir, 'history.json')
if(!fse.existsSync(historyConfPath)) fse.writeJSONSync(historyConfPath, {history: []})
const history = fse.readJsonSync(historyConfPath)

/** @type {Record<string, {cmd: string, args: string[]}>} */
const alias = {
  ls: {cmd: `ls`, args: ['--color=force']}
}

/** @param {import('../../typings/export').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  const { findService, Socket } = stackMonitor
  router.get('/logs/:service/logs', function (req, res) {
    const service = findService(req.params.service)
    res.send(service ? service.store : [])
  });
  
  router.get('/logs/:service/autocomplete', function (req, res) {
    const service = findService(req.params.service)
    const msg = req.query.message
    if(!msg) return res.json([])
    const historyToSend = groupBy(history.history, 'raw')
      .sort(((a, b) => a.timestamp - b.timestamp))
      .filter(a => a?.raw?.startsWith(msg))
      .slice(-10)
    res.json(historyToSend)
  });

  router.post('/logs/:service/prompt', function (req, res) {
    const service = findService(req.params.service)
    /** @type {string | undefined} */
    const message = req.body.message?.trim()
    const pid = req.body.pid
    if(!message) throw new Error('command cannot empty')
    let cmd = message.trim().split(' ')[0]
    cmd = alias[cmd]?.cmd.trim() || cmd.trim()
    const args = ((alias[cmd]?.args?.join(' ') || '')+ ' ' + req.body?.message?.trim()?.split(' ')?.slice(1)?.join(' ')).trim()
    if(pid) service.respondToProcess(pid, message)
    else service.launchProcess(cmd, [args], service.spawnOptions)
    Socket.io?.emit('logs:update', [])
    history.history.push({cmd, args, raw: `${cmd} ${args}`, timestamp: Date.now(), service: service.label})
    saveHistory()
    res.send('ok')
  });

  router.delete('/logs/:service/logs', function (req, res) {
    const service = findService(req.params.service)
    service.store = []
    Socket.io?.emit('logs:clear', { label: service.label })
    res.send(service.store)
  });

  function saveHistory() {
    fse.writeJsonSync(historyConfPath, history)
  }
  return router
}

/**
 * 
 * @param {Record<string, any>[]} xs 
 * @param {string} key 
 * @returns 
 */
var groupBy = function(xs, key) {
  const group = xs.reduce(function(rv, x) {
    if(!rv[x[key]]) rv[x[key]] = {...x, number: 0, timestamps: []}
    rv[x[key]].timestamps.push(x.timestamp)
    rv[x[key]].timestamp = x.timestamp

    return rv;
  }, {})
  return Object.keys(group).map(key => group[key]);
};

