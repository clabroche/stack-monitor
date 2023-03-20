const express = require('express');
const app = express();
const ports = require('./ports')
app.use(require('cors')())
const {Server} = require('socket.io');

const Socket = {
  /** @type {import('socket.io').Socket} */
  socket: null,
  init(server) {
    const io = new Server(server, {
      cors: {
        origin: '*',
      }
    });
    io.on('connection', function (_socket) {
      console.log('Connection etablished')
      Socket.socket = _socket
    });
  }
}

module.exports = Socket