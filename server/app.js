const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const indexRouter = require('./routes/index');

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
module.exports = app;

require('./models/socket')