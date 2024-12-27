require('express-async-errors');
const express = require('express');
const cors = require('cors');
const pathfs = require('path');
const fs = require('fs');
const healthCheck = require('@clabroche/common-express-health-check');
const helmet = require('helmet').default;
const cookieParser = require('cookie-parser');
const compression = require('compression');
const http = require('http');
const Socket = require('@clabroche/common-socket-server');

require('express-async-errors');

module.exports = {
  /**
   * @param {{
   *  port: number | string,
   *  baseUrl?: string,
   *  helmetConf?: import('helmet').HelmetOptions | null,
   *  corsConf?: import('cors').CorsOptions,
   *  beforeAll?: ({app, server}) => any,
   *  afterAll?: () => any,
   *  socket?: boolean,
   *  onListening?: (server: {server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>, app: import('express').Express}) => any,
   *  beforeStatic?: (server: {server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>, app: import('express').Express}) => any,
   *  afterControllers?: (server: {server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>, app: import('express').Express}) => any,
   *  controllers?: () => import('express').RequestHandler,
   *  staticController?: string,
   *  noGreetings?: boolean,
   *  apiPrefix?: string
   *  bodyLimit?: string
   *  healthPath?: string
   * }} param0
   * @returns
   */
  launch: async ({
    port = process.env.PORT || 4002,
    baseUrl = __dirname,
    helmetConf = {},
    corsConf = {},
    beforeAll = () => {},
    afterAll = () => {},
    onListening = () => { },
    beforeStatic = () => { },
    afterControllers = () => { },
    controllers = () => () => {},
    staticController = undefined,
    noGreetings = false,
    socket = false,
    apiPrefix = '/api',
    bodyLimit = '50mb',
    healthPath = apiPrefix,
  }) => {
    const pkgJSONPath = pathfs.resolve(baseUrl, 'package.json');
    const isPkgJSONExists = fs.existsSync(pkgJSONPath);
    const pkgJSON = isPkgJSONExists ? require(pkgJSONPath) : { name: 'unknown', version: 'unknown' };
    const appVersion = pkgJSON.version;
    const appName = pkgJSON.name;

    console.log(`<h2 style="background: linear-gradient(90deg, rgba(52,70,91,1) 0%, rgba(28,92,227,1) 100%);color:white;border-radius:10px;padding:10px;width: max-content">${appName.replace('@clabroche/', '')}</h2>`);
    console.log(`v${appVersion} started, listening on port ${port}.`);

    const app = express();

    const server = http.createServer(app);
    if (helmetConf) {
      app.use(helmet(
        helmetConf,
      ));
    }

    console.log('Enable cors...');
    app.use(cors(corsConf));
    app.options('*', (req, res, next) => {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      next();
    });

    console.log('Enable JSON body...');
    app.use(express.json({ limit: bodyLimit }));
    app.use(express.urlencoded({ extended: true }));

    console.log('Enable Cookie parser...');
    app.use(cookieParser());

    console.log('Enable Compression...');
    app.use(compression());

    console.log('Enable health check...');
    app.use(healthPath, healthCheck(express, { name: appName, version: appVersion }));

    beforeStatic?.({ server, app });

    console.log('Apply additional routes...');
    if (staticController) {
      app.use('/', express.static(staticController));
    }

    if (socket) {
      console.log('Enable socket...');
      Socket.sockets.connect(server);
    }
    app.use(apiPrefix, controllers());

    if (!noGreetings) {
      app.get('/', (req, res) => res.json({ appName, appVersion }));
    }

    afterControllers?.({ server, app });
    if (process.env.NODE_ENV === 'HFBXdZMJxLyJoua28asEaxRixJ6LriR7FnRzX6pwA7pFjZ') {
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
    console.log('Enable error handling...');
    app.use(require('@clabroche/common-express-error-handler')());

    console.log('Enable 404 handling...');
    app.use(require('@clabroche/common-express-404'));

    console.log('Apply additional tasks before launch...');
    await beforeAll({ app, server });

    console.log('Launch...');
    server.on('listening', () => onListening({ server, app }));

    server.listen(port, async () => {
      console.log('<h1>✓ Launched</h1>');
    });
    server.on('close', async () => {
      await afterAll();
    });

    return server;
  },
  express,
};
