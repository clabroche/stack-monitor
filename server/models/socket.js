const express = require('express');
const app = express();
const ports = require('./ports')
app.use(require('cors')())
// @ts-ignore
const server = require('http').createServer(app);
const {Server} = require('socket.io');
const io = new Server(server, {cors: {
    origin: '*',
  }
});

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