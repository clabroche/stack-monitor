// @ts-ignore
require('express-async-errors');
const { express } = require('@clabroche/common-express');
const indexRouter = require('./routes/index');
const { stopCpu } = require('./helpers/cpu');
const { stopWatchers } = require('./models/stack');

const app = express();

app.use('/', indexRouter);

// @ts-ignore
app.stopWorkers = async () => {
  await stopCpu();
  stopWatchers();
};
module.exports = app;
