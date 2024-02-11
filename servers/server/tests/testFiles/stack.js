const pathfs = require('path');

/** @type {import('../../models/stack').StackObject} */
const stack = {
  watchFiles: [
    pathfs.resolve(__dirname, '.env'),
  ],
  services: require('./services'),
};

module.exports = stack;
