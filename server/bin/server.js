process.title = "stack-monitor"
const ports = require('../models/ports');
const ViteExpress = require("vite-express");
ports.cleanHtml()
const app = require('../app');
require('../models/socket')
const http = require('http');
const table = require('../helpers/console.table')

const server = http.createServer(app);

// server.listen(process.env.HTTP_PORT || 0);
ViteExpress.listen(app, process.env.HTTP_PORT || 0, () => console.log("Server is listening..."));

server.on('listening', () => {
  const addr = server.address();
  const port = typeof addr === 'string'
    ? addr
    : addr.port;
  ports.setHttpPort(+port)
  if (process.env.NODE_ENV !== "DEV" && !process.versions['electron']) {
    require('open')('http://localhost:' + port)
  }
  console.log('Magic happens on ' + port);
});



// Tips
(() => {
  table([
    { '': 'Port', Value: ports.http, 'Overrided By': 'HTTP_PORT' },
    { '': 'Socket', Value: ports.socket, 'Overrided By': 'SOCKET_PORT' },
    { '': 'Url', Value: `http://localhost:${ports.http}`, 'Overrided By': '-' },
  ])
})()