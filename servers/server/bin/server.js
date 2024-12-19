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
    staticController: process.env.NODE_ENV !== 'DEV' ? pathfs.resolve(__dirname, 'public') : undefined,
    helmetConf: process.env.NODE_ENV !== 'DEV' ? {
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: {
        directives: {
          'frame-src': ["'self'", 'clabroche.github.io', 'jsoncrack.com'],
        },
        useDefaults: true,
      },
    } : null,
    afterControllers({ app, server }) {
      if (process.env.NODE_ENV === 'DEV') {
        const httpProxy = require('http-proxy');
        const proxy = httpProxy.createProxy({ ws: true });
        server.on('upgrade', (req, res) => {
          if (req.url === '/') {
            proxy.ws(req, res, {
              target: 'ws://localhost:5173',
            });
          }
        });
        app.use((req, res) => {
          proxy.web(req, res, {
            target: 'ws://localhost:5173',
          });
        });
      }
    },
    onListening({ server }) {
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
          ...args.services.length
            ? [{ '': 'Services', Value: args.services.join(', '), 'Overrided By': '-' }]
            : [],
        ]);
      })();
    },
  });
  console.log(args.confPath)
  await require('../models/stack').selectConf(args.confPath);
})();
