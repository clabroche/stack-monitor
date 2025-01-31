const { launch } = require('@clabroche/common-express');
const pathfs = require('path');
const ports = require('../models/ports');
const table = require('../helpers/console.table');
const args = require('../helpers/args');

module.exports = {
  async launch() {
    await launch({
      port: process.env.STACK_MONITOR_HTTP_PORT || 0,
      controllers: () => require('../app'),
      socket: true,
      apiPrefix: '/',
      bodyLimit: '100mb',
      noGreetings: true,
      staticController: process.env.NODE_ENV !== 'HFBXdZMJxLyJoua28asEaxRixJ6LriR7FnRzX6pwA7pFjZ' ? pathfs.resolve(__dirname, 'public') : undefined,
      helmetConf: process.env.NODE_ENV !== 'HFBXdZMJxLyJoua28asEaxRixJ6LriR7FnRzX6pwA7pFjZ' ? {
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: false,
        contentSecurityPolicy: {
          directives: {
            upgradeInsecureRequests: null,
            'frame-src': ["'self'", 'clabroche.github.io', 'jsoncrack.com'],
          },
          useDefaults: true,
        },
      } : null,
      onListening({ server }) {
        const addr = server.address();
        const port = typeof addr === 'string'
          ? addr
          : addr?.port;
        ports.setHttpPort(+(port || 0));
        if (process.env.NODE_ENV !== 'HFBXdZMJxLyJoua28asEaxRixJ6LriR7FnRzX6pwA7pFjZ' && !process.versions.electron) {
          require('open')(`http://localhost:${port}`);
        }
        // Tips
        (() => {
          table([
            { '': 'Version', Value: require('../helpers/version').version, 'Overrided By': '-' },
            { '': 'Port', Value: ports.http, 'Overrided By': 'STACK_MONITOR_HTTP_PORT' },
            { '': 'Url', Value: `http://localhost:${ports.http}`, 'Overrided By': '-' },
            ...args.services.length
              ? [{ '': 'Services', Value: args.services.join(', '), 'Overrided By': '-' }]
              : [],
          ]);
        })();
      },
    });
    await require('../models/stack').selectConf();
  },
};
