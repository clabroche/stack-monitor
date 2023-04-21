const express = require("express");
const router = express.Router();
const { v4 } = require("uuid");
const socketId = v4()
const pathfs = require('path');
const { mkdirSync, existsSync } = require("fs");
const fse = require('fs-extra')
const { spawn } = require('child_process')

const homedir = require('os').homedir();
const confDir = pathfs.resolve(homedir, '.stack-monitor')

if (!existsSync(confDir)) mkdirSync(confDir)
const confPath = pathfs.resolve(confDir, 'node-repl')
if (!fse.existsSync(confPath)) fse.writeJSONSync(confPath, {})
const conf = fse.readJsonSync(confPath)

/** @param {import('../../typings/index').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
    const {Socket} = stackMonitor
    router.post("/node-repl/open-repl", async (req, res) => {
        res.json(socketId);
    });
    
    router.post('/node-repl/chat/:room', async (req, res) => {
        const { room } = req.params
        const {script} = req.body
        if (!conf?.chat?.[room]) {
            if (!conf?.chat) conf.chat = {}
            if (!conf?.chat?.[room]) conf.chat[room] = {}
        }
        conf.chat[room].script = script
        const socketId = v4()
        await fse.writeFile(pathfs.resolve(__dirname, socketId), script)
        const spawnCmd = spawn('node', [pathfs.resolve(__dirname, socketId)], {
            env: Object.assign({}, process.env),
            cwd: pathfs.resolve(__dirname)
        })
        let result = ''
        Socket.io?.emit('node-repl:update', { clear: true })
        spawnCmd.stdout.on('data', (data) => {
            Socket.io?.emit('node-repl:update', { msg: data.toString('utf-8') })
            result += data.toString('utf-8')
        })
        spawnCmd.stderr.on('data', (data) => {
            Socket.io?.emit('node-repl:update', { msg: data.toString('utf-8') })
            result += data.toString('utf-8')
        })
        spawnCmd.on('close', () => {
            Socket.io?.emit('node-repl:update', { close: true })
            conf.chat[room].result = result
            fse.unlinkSync(pathfs.resolve(__dirname, socketId))
            save()
        })
        save()
        res.json(socketId)
    })
    
    
    router.get('/node-repl/rooms', async (req, res) => {
        res.json(Object.keys(conf?.chat || {}))
    })
    router.post('/node-repl/rooms', async (req, res) => {
        const { room } = req.body
        if (!conf?.chat?.[room]) {
            if (!conf?.chat) conf.chat = {}
            if (!conf?.chat?.[room]) conf.chat[room] = {}
        }
        save()
        res.json(Object.keys(conf?.chat || {}))
    })
    
    router.delete('/node-repl/rooms/:room', async (req, res) => {
        const { room } = req.params
        if (conf?.chat?.[room]) delete conf.chat[room]
        save()
        res.json(Object.keys(conf?.chat || {}))
    })
    
    router.get('/node-repl/chat/:room', async (req, res) => {
        res.json(conf?.chat?.[req.params.room])
    })
    
    function save() {
        fse.writeJsonSync(confPath, conf)
    }
    return router
}

