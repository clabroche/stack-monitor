const express = require('express');
const app = express.Router;
const ports = require('./ports')

// @ts-ignore
const server = require('http').Server(app);
const io = require('socket.io')(server);

server.listen(process.env.SOCKET_PORT || 0);
ports.setSocketPort(server.address().port)
console.log(`Socket wait on ${ports.socket}`)

const Socket = {
  /** @type {SocketIO.Socket} */
  socket: null
}
io.on('connection', function (_socket) {
  console.log('Connection etablished')
  Socket.socket = _socket
});
module.exports = Socket