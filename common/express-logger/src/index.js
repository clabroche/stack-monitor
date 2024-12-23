const uuid = require('uuid').v4;
const dayjs = require('dayjs');
const pathfs = require('path');
const HTTPError = require('@clabroche/common-express-http-error');
const pino = require('pino');

dayjs.locale('fr');

/**
 * @type {{
 *   rotateConfig: {
 *     size: string,
 *     interval: string,
 *     maxFiles: number,
 *     path: string,
 *   },
 *   infoLogger: pino.Logger,
 *   accessLogger: pino.Logger,
 *   errorLogger: pino.Logger,
 * }}
 */
let conf;

module.exports = {
  getConf() {
    return conf;
  },
  init({
    path,
    size = '10M',
    interval = '1d',
    maxFiles = 120,
  }) {
    if (!path) throw new Error('You should set path for logger');
    const rotateConfig = {
      size,
      interval,
      maxFiles,
      path,
    };
    conf = {
      rotateConfig,
      infoLogger: pino.default(),
      accessLogger: pino.default({
        name: 'info',
        level: 'trace',
        transport: {
          targets: [
            {
              target: pathfs.resolve(__dirname, 'transport.js'),
              level: 'trace',
              options: {
                append: true,
                destination: pathfs.resolve(path, 'access.log'),
                interval,
                size,
                maxFiles,
              },
            },
          ],
        },
      }),
      errorLogger: pino.default({
        name: 'error',
        level: 'error',
        transport: {
          targets: [
            {
              target: pathfs.resolve(__dirname, 'transport.js'),
              level: 'error',
              options: {
                append: true,
                destination: pathfs.resolve(path, 'errors.log'),
                size,
                interval,
              },
            },
          ],
        },
      }),
    };
    return conf;
  },
  info(obj) {
    if (process.env.NODE_ENV !== 'HFBXdZMJxLyJoua28asEaxRixJ6LriR7FnRzX6pwA7pFjZ') return;
    const date = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const data = JSON.stringify({ date, ...obj });
    conf.infoLogger.info(data);
  },
  /** @param {HTTPError | Error | string} err */
  error(err) {
    const errorId = uuid();
    const date = dayjs().format('YYYY-MM-DD HH:mm:ss');
    if (process.env.NODE_ENV !== 'HFBXdZMJxLyJoua28asEaxRixJ6LriR7FnRzX6pwA7pFjZ') {
      console.log(err?.message || err);
      return {
        errorId,
        date,
      };
    }

    if (!conf) throw new Error('Logger not inited');
    let message = '';
    if (typeof err === 'string') message = err;
    else if (err instanceof HTTPError) message = err.originalMessage;
    else if (err instanceof Error) message = err.message;

    let stack = '';
    if (typeof err === 'string') stack = formatStack(err);
    else if (err instanceof HTTPError) stack = err.originalStack || '';
    else if (err instanceof Error) stack = err.stack || '';

    const error = JSON.stringify({
      errorId,
      date,
      message,
      httpMethod: err?.response?.request?.method,
      httpMessage: JSON.stringify(err?.response?.data),
      httpRequest: err?.response?.request?.res?.responseUrl,
      stack,
    });
    conf.errorLogger.error(error);
    return {
      errorId,
      date,
    };
  },
};

/** @param {String}  stack */
function formatStack(stack = '') {
  return stack.split
    ? stack
      .split('\n')
      .map((line) => `├── ${line}`)
      .join('\n')
    : stack;
}
