const express = require('express');
const { v4 } = require('uuid');
const { mkdir, writeFile } = require('fs/promises');
const { writeFileSync, readFileSync, unlinkSync } = require('fs');
const pathfs = require('path');
const { mkdirSync, existsSync } = require('fs');
const { spawn } = require('child_process');

const router = express.Router();
const homedir = require('os').homedir();

const confDir = pathfs.resolve(homedir, '.stack-monitor');

if (!existsSync(confDir)) mkdirSync(confDir);
const confPath = pathfs.resolve(confDir, 'node-repl');
if (!existsSync(confPath)) writeFileSync(confPath, '{}', 'utf-8');
const conf = JSON.parse(readFileSync(confPath, 'utf-8'));

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
    if (!existsSync(pathfs.dirname(filePath))) {
      await mkdir(pathfs.dirname(filePath));
    }
    await writeFile(filePath, script);
    const spawnCmd = spawn('node', [filePath], {
      env: { ...process.env },
      cwd: pathfs.resolve(__dirname),
    });
    let result = '';
    Socket.emit('node-repl:update', { clear: true });
    spawnCmd.stdout.on('data', (data) => {
      Socket.emit('node-repl:update', { msg: data.toString('utf-8') });
      result += data.toString('utf-8');
    });
    spawnCmd.stderr.on('data', (data) => {
      Socket.emit('node-repl:update', { msg: data.toString('utf-8') });
      result += data.toString('utf-8');
    });
    spawnCmd.on('close', () => {
      Socket.emit('node-repl:update', { close: true });
      conf.chat[room].result = result;
      unlinkSync(filePath);
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
    writeFileSync(confPath, JSON.stringify(conf), 'utf-8');
  }
  return router;
};
