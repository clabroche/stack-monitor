process.title = 'stack-monitor';
const { launch } = require('@clabroche/common-express');
const pathfs = require('path');
const ports = require('../models/ports');
const table = require('../helpers/console.table');
const args = require('../helpers/args');

(async () => {
  await launch({
    port: process.env.HTTP_PORT || 0,
    controllers: () => require('../app'),
    socket: true,
    apiPrefix: '/',
    bodyLimit: '100mb',
    noGreetings: true,
    staticController: pathfs.resolve(__dirname, 'public'),
    onListening(server) {
      const addr = server.address();
      const port = typeof addr === 'string'
        ? addr
        : addr?.port;
      ports.setHttpPort(+(port || 0));
      if (process.env.NODE_ENV !== 'DEV' && !process.versions.electron) {
        require('open')(`http://localhost:${port}`);
      }
      // Tips
      (() => {
        table([
          { '': 'Version', Value: require('../helpers/version').version, 'Overrided By': '-' },
          { '': 'Port', Value: ports.http, 'Overrided By': 'HTTP_PORT' },
          { '': 'Url', Value: `http://localhost:${ports.http}`, 'Overrided By': '-' },
        ]);
      })();
    },
  });
  if (args.confPath) {
    await require('../models/stack').selectConf(args.confPath);
  }
})();
