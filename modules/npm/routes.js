const express = require('express');
const router = express.Router();
const Npm = require('./Npm');
const {v4} = require('uuid');

/** @param {import('../../typings/index').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  const { findService, Socket } = stackMonitor

  router.get('/npm/:service', async function (req, res) {
    const service = findService(req.params.service)
    const npm = new Npm(service)
    const isNpm = await npm.isNpm()
    res.json(isNpm)
  })
  
  router.get('/npm/:service/packagejson', async function (req, res) {
    const service = findService(req.params.service)
    const npm = new Npm(service)
    const packagejson = await npm.packageJSON()
    res.json(packagejson)
  })
  
  router.get('/npm/:service/outdated', async function (req, res) {
    const service = findService(req.params.service)
    const npm = new Npm(service)
    const packagejson = await npm.outdated()
    res.json(packagejson)
  })
  
  router.get('/npm/:service/run/:command', async function (req, res) {
    const service = findService(req.params.service)
    const npm = new Npm(service)
    const uuid = `npm:${v4()}`
    const process = await npm.run(req.params.command)
    process?.stdout?.on('data', msg => {
      Socket.io?.emit(uuid, { msg: msg.toString(), label: service.label })
    })
    process?.stderr?.on('data', msg => {
      Socket.io?.emit(uuid, { msg: msg.toString(), label: service.label, error: true })
    })
    process?.on('close', (code) => {
      Socket.io?.emit(uuid, { msg: '!:;end', label: service.label, error: code !== 0 })
    });
  
    res.json(uuid)
  })
  return router
}
