const CustomObservable = require('../helpers/CustomObservable');
const express = require('express');
const app = express();
app.use(require('cors')())
const {Server} = require('socket.io');

/** @type {Record<string, CustomObservable>} */
const events = {}

const Socket = {
  /** @type {import('socket.io').Server | null} */
  io: null,
  /**
   * 
   * @param {string} event 
   * @param {(socket: import('socket.io').Socket, data: any) => any} cb 
   */
  on: (event, cb) => {
    if (!events[event]) events[event] = new CustomObservable()
    events[event].subscribe(cb)
  },
  /** @param {import('http').Server} server*/
  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: '*',
      }
    });
    this.io.on('connection', function (_socket) {
      _socket.onAny((event, ...data) => {
        events[event]?.next(_socket, ...data)
      })
      console.log('Connection etablished')
    });
  }
}

module.exports = Socket