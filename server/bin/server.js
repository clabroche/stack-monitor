process.title = "stack-monitor"
const ports = require('../models/ports');
// const ViteExpress = require("vite-express");
ports.cleanHtml()
const app = require('../app');
const http = require('http');
const table = require('../helpers/console.table');
const Stack = require('../models/stack');
const args = require('../helpers/args');


const server = http.createServer(app)
require('../models/socket').init(server)

server.on('listening', () => {
  const addr = server.address();
  const port = typeof addr === 'string'
    ? addr
    : addr?.port;
  ports.setHttpPort(+(port || 0))
  if (process.env.NODE_ENV !== "DEV" && !process.versions['electron']) {
    require('open')('http://localhost:' + port)
  }
  // Tips
  (() => {
    table([
      { '': 'Version', Value: require('../../package.json').version, 'Overrided By': '-' },
      { '': 'Port', Value: ports.http, 'Overrided By': 'HTTP_PORT' },
      { '': 'Url', Value: `http://localhost:${ports.http}`, 'Overrided By': '-' },
    ])
  })()  
});


; (async () => {
  if (args.confPath) {
    await Stack.selectConf(args.confPath)
  }
  server.listen(process.env.HTTP_PORT || 0);
})()
