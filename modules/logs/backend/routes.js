const express = require('express');
const { v4 } = require('uuid');

const router = express.Router();

/** @param {import('@clabroche/common-typings').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  const history = stackMonitor.getSave('history.json', {
    /** @type {History[]} */
    history: [],
  });

  const { findService, Socket } = stackMonitor;
  router.get('/logs/:service/logs', (req, res) => {
    const service = findService(req.params.service);
    res.send(service ? service.store : []);
  });

  router.get('/logs/:service/autocomplete', (req, res) => {
    const msg = req.query.message;
    if (!msg && !req.query.force) return res.json([]);
    const historyToSend = groupBy(history.data.history, 'raw')
      .sort(((a, b) => a.timestamp - b.timestamp))
      .filter((a) => a?.raw?.startsWith(msg) || a.cmd?.startsWith(msg))
      .slice(-10);
    return res.json(historyToSend);
  });

  router.post('/logs/:service/prompt', async (req, res) => {
    const service = findService(req.params.service);
    /** @type {Record<any, any>} */
    let command = req.body.command || {};
    /** @type {number | undefined} */
    const pid = req.body.pid ? +req.body.pid : undefined;
    if (!command.spawnCmd) command.spawnCmd = '\n';
    /** @type {History} */
    let result = {
      id: v4(), pid, cmd: command.spawnCmd, args: [], raw: command.spawnCmd, timestamp: Date.now(), service: service.label || '',
    };
    if (pid) service.respondToProcess(pid, command.spawnCmd);
    else if (command) {
      const { spawnProcess, launchMessage } = await service.launchProcess(
        { spawnCmd: command.spawnCmd, spawnArgs: command.spawnArgs || [], spawnOptions: command.spawnOptions || {  } },
        false,
      );
      result = {
        ...result,
        pid: spawnProcess?.pid,
        raw: launchMessage.raw,
        timestamp: launchMessage.timestamp,
      };
      history.data.history.push(result);
      history.save();
    }

    res.json(result);
  });

  router.post('/logs/:service/terminate', (req, res) => {
    const service = findService(req.params.service);
    const {
      /** @type {number | undefined} */
      pid,
      /** @type {boolean | undefined} */
      forceKill,
    } = req.body;
    if (!pid) throw new Error('Pid is required');
    if (pid) service.terminate(pid, !!forceKill);
    Socket.emit('logs:update', []);
    res.send('ok');
  });

  router.delete('/logs/:service/logs', (req, res) => {
    const service = findService(req.params.service);
    service.store = [];
    Socket.emit('logs:clear', { label: service.label });
    res.send(service.store);
  });
  return router;
};

/**
 *
 * @param {Record<string, any>[]} xs
 * @param {string} key
 * @returns
 */
const groupBy = (xs, key) => {
  const group = xs.reduce((rv, x) => {
    if (!rv[x[key]]) rv[x[key]] = { ...x, number: 0, timestamps: [] };
    rv[x[key]].timestamps.push(x.timestamp);
    rv[x[key]].timestamp = x.timestamp;

    return rv;
  }, {});
  return Object.keys(group).map((key) => group[key]);
};

/**
 * @typedef {{
 *   id: string,
 *   cmd: string,
 *   args: string[],
 *   raw: string,
 *   timestamp: number,
 *   service: string,
 *   pid?: number,
 * }} History
 */
