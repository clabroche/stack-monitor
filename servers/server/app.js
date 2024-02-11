// @ts-ignore
require('express-async-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const indexRouter = require('./routes/index');
const { stopCpu } = require('./helpers/cpu');
const { stopWatchers } = require('./models/stack');

const app = express();

app.use(require('cors')());

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(/** @type {ExpressMiddlewareError} */ ((err, req, res, _next) => {
  console.error(err?.message || err);
  if (err?.stack) console.error(err.stack);
  res.status(500).send(err?.message || err);
}));

// @ts-ignore
app.stopWorkers = async () => {
  await stopCpu();
  stopWatchers();
};
module.exports = app;

/**
 * @typedef {(err: any, req: import('express').Request, res: import('express').Response, next: () => any) => {}} ExpressMiddlewareError
 */

process.stdin.resume(); // so the program will not close instantly

function exitHandler() {
  console.log(JSON.stringify(['stack-monitor', 'fmzelkf'],(_, v) => (typeof v === 'function' ? `[func]` : v)));
}

process.on('exit', exitHandler);
process.on('SIGINT', exitHandler);
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);
process.on('uncaughtException', exitHandler);
