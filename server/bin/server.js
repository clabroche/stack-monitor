process.title = "stack-monitor"
const fs = require('fs')
const path = require('path')
const app = require('../app');
require('../models/socket')
const http = require('http');

let port
if (process.env.NODE_ENV === "DEV") {
  port = fs
    .readFileSync(path.resolve(__dirname, '..', '..', '.env.local'), 'utf-8')
    .split('\n')
    .filter(line => line.includes('VUE_APP_SERVER_PORT'))[0]
    .split('=')[1]
} else {
  port = fs
    .readFileSync(path.resolve(__dirname, '..', '..', '.env.production'), 'utf-8')
    .split('\n')
    .filter(line => line.includes('VUE_APP_SERVER_PORT'))[0]
    .split('=')[1]
}
app.set('port', port);

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  if (process.env.NODE_ENV !== "DEV" && !process.versions['electron']) {
    require('open')('http://localhost:' + port)
  }
  console.log('Magic happens on ' + bind);
}

const server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
