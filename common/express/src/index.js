require('express-async-errors');
const express = require('express');
const { initSwagger } = require('@clabroche/common-swagger');
const swagger = require('@clabroche/common-swagger');
const logger = require('@clabroche/common-express-logger');
const cors = require('cors');
const pathfs = require('path');
const fs = require('fs');
const context = require('@clabroche/common-context').init;
const healthCheck = require('@clabroche/common-express-health-check');
const helmet = require('helmet').default;
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const pino = require('pino');
const pinoHttp = require('pino-http');

require('express-async-errors');

module.exports = {
  /**
   * @param {{
   *  port: number | string,
   *  baseUrl?: string,
   *  helmetConf?: import('helmet').HelmetOptions,
   *  corsConf?: import('cors').CorsOptions,
   *  beforeAll?: () => any,
   *  afterAll?: () => any,
   *  controllers?: import('express').RequestHandler,
   *  staticController?: import('express').RequestHandler,
   *  additionalSwaggerPaths?: string[]
   *  noGreetings?: boolean,
   *  apiPrefix?: string
   *  bodyLimit?: string
   *  healthPath?: string
   *  apiDocsPath?: string
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
    controllers = () => {},
    staticController = undefined,
    noGreetings = false,
    additionalSwaggerPaths = [],
    apiPrefix = '/api',
    bodyLimit = '50mb',
    healthPath = apiPrefix,
    apiDocsPath = apiPrefix,
  }) => {
    const pkgJSONPath = pathfs.resolve(baseUrl, 'package.json');
    const isPkgJSONExists = fs.existsSync(pkgJSONPath);
    const pkgJSON = isPkgJSONExists ? require(pkgJSONPath) : { name: 'unknown', version: 'unknown' };
    const appVersion = pkgJSON.version;
    const appName = pkgJSON.name;

    console.log(`<h2 style="background: linear-gradient(90deg, rgba(52,70,91,1) 0%, rgba(28,92,227,1) 100%);color:white;border-radius:10px;padding:10px;width: max-content">${appName.replace('@clabroche/', '')}</h2>`);
    console.log(`v${appVersion} started, listening on port ${port}.`);

    const app = express();
    app.use(helmet(
      helmetConf,
    ));

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

    console.log('Enable Logger...');
    logger.init({
      path: pathfs.resolve(baseUrl, 'logs-express'),
    });
    const accessLogger = pinoHttp.default({
      autoLogging: {
        ignore: (req) => !!(req.url?.endsWith('/health')),
      },
      logger: logger.getConf().accessLogger,
      serializers: {
        req: pino.stdSerializers.wrapRequestSerializer((r) => {
          r.headers = {
            ...r.headers,
            cookie: '',
            authorization: '',
          };
          return r;
        }),
      },
    });
    console.log('Enable swagger...');
    app.use(swagger);
    await initSwagger({
      appVersion, baseUrl, appName, additionalSwaggerPaths, apiDocsPath,
    }).catch((err) => console.error(`Swagger error: ${err?.message || err}`));
    console.log('Enable health check...');
    app.use(healthPath, healthCheck(express, { name: appName, version: appVersion }));

    console.log('Apply additional routes...');
    app.use(context);

    app.use(apiPrefix, accessLogger, controllers);
    if (!noGreetings) {
      app.get('/', (req, res) => res.json({ appName, appVersion }));
    }

    if (staticController) {
      app.use(accessLogger, staticController);
      app.use(accessLogger, (req, res) => {
        res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
      });
    }

    console.log('Enable error handling...');
    app.use(require('@clabroche/common-express-error-handler')());

    console.log('Enable 404 handling...');
    app.use(require('@clabroche/common-express-404'));

    console.log('Apply additional tasks before launch...');
    await beforeAll();

    console.log('Launch...');
    const server = app.listen(port, async () => {
      console.log('<h1>✓ Launched</h1>');
    });
    server.on('close', async () => {
      await afterAll();
    });

    return server;
  },
  express,
};
