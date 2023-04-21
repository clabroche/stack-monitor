const express = require('express');
require('express-async-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const indexRouter = require('./routes/index');
const { stopCpu } = require('./helpers/cpu');
const { stopWatchers } = require('./models/stack');

const app = express();

app.use(require('cors')());
app.use(express.json({limit: '100mb'}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

app.use(/** @type {ExpressMiddlewareError} */ ((err, req, res, next) => {
  console.error(err)
  res.status(500).send(err)
}));

// @ts-ignore
app.stopWorkers = async () => {
  await stopCpu()
  stopWatchers()
}
module.exports = app;

/**
 * @typedef {(err: any, req: import('express').Request, res: import('express').Response, next: () => any) => {}} ExpressMiddlewareError
 */