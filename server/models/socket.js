const express = require('express');
const app = express();
app.use(require('cors')())
const {Server} = require('socket.io');

const Socket = {
  /** @type {import('socket.io').Server | null} */
  io: null,
  /** @param {import('http').Server} server*/
  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: '*',
      }
    });
    this.io.on('connection', function (_socket) {
      console.log('Connection etablished')
    });
  }
}

module.exports = Socket