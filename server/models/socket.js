var express = require('express');
var app = express.Router;
const fs = require('fs')
const path = require('path')
const port = fs
    .readFileSync(path.resolve( __dirname,'..','..','.env.local'), 'utf-8')
    .split('\n')
    .filter(line => line.includes('VUE_APP_SOCKET_PORT'))[0]
    .split('=')[1]

var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(port);
console.log('Socket wait on ' + port)


const Socket = {
  /** @type {SocketIO.Socket} */
  socket: null
}
io.on('connection', function (_socket) {
  console.log('Connection etablished')
  Socket.socket = _socket
});
module.exports = Socket