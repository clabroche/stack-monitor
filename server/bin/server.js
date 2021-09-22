process.title = "stack-monitor"
const ports = require('../models/ports');
ports.cleanHtml()
const app = require('../app');
require('../models/socket')
const http = require('http');

const server = http.createServer(app);
server.listen(process.env.HTTP_PORT || 0);

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
