const express = require('express');
const { v4 } = require('uuid');
const fse = require('fs-extra');
const pathfs = require('path');
const { mkdirSync, existsSync } = require('fs');
const { spawn } = require('child_process');

const router = express.Router();
const homedir = require('os').homedir();

const confDir = pathfs.resolve(homedir, '.stack-monitor');

if (!existsSync(confDir)) mkdirSync(confDir);
const confPath = pathfs.resolve(confDir, 'node-repl');
if (!fse.existsSync(confPath)) fse.writeJSONSync(confPath, {});
const conf = fse.readJsonSync(confPath);

/** @param {import('@clabroche/common-typings').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  const { Socket } = stackMonitor;
  router.post('/node-repl/chat/:room', async (req, res) => {
    const { room } = req.params;
    const { script } = req.body;
    if (!conf.chat?.[room]) {
      if (!conf.chat) conf.chat = {};
      if (!conf.chat?.[room]) conf.chat[room] = {};
    }
    conf.chat[room].script = script;
    const uuid = v4();
    const filePath = pathfs.resolve(__dirname, 'sandbox-node-repl', uuid);
    if (!fse.existsSync(pathfs.dirname(filePath))) {
      await fse.mkdir(pathfs.dirname(filePath));
    }
    await fse.writeFile(filePath, script);
    const spawnCmd = spawn('node', [filePath], {
      env: { ...process.env },
      cwd: pathfs.resolve(__dirname),
    });
    let result = '';
    Socket.io?.emit('node-repl:update', { clear: true });
    spawnCmd.stdout.on('data', (data) => {
      Socket.io?.emit('node-repl:update', { msg: data.toString('utf-8') });
      result += data.toString('utf-8');
    });
    spawnCmd.stderr.on('data', (data) => {
      Socket.io?.emit('node-repl:update', { msg: data.toString('utf-8') });
      result += data.toString('utf-8');
    });
    spawnCmd.on('close', () => {
      Socket.io?.emit('node-repl:update', { close: true });
      conf.chat[room].result = result;
      fse.unlinkSync(filePath);
      save();
    });
    save();
    res.json(uuid);
  });

  router.get('/node-repl/rooms', async (req, res) => {
    res.json(Object.keys(conf?.chat || {}));
  });
  router.post('/node-repl/rooms', async (req, res) => {
    const { room } = req.body;
    if (!conf?.chat?.[room]) {
      if (!conf?.chat) conf.chat = {};
      if (!conf?.chat?.[room]) conf.chat[room] = {};
    }
    save();
    res.json(Object.keys(conf?.chat || {}));
  });

  router.delete('/node-repl/rooms/:room', async (req, res) => {
    const { room } = req.params;
    if (conf?.chat?.[room]) delete conf.chat[room];
    save();
    res.json(Object.keys(conf?.chat || {}));
  });

  router.get('/node-repl/chat/:room', async (req, res) => {
    res.json(conf?.chat?.[req.params.room]);
  });

  function save() {
    fse.writeJsonSync(confPath, conf);
  }
  return router;
};
