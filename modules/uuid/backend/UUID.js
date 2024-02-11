const { v4 } = require('uuid');

/** @param {import('@clabroche/fronts-app/typings/export').StackMonitor} stackMonitor */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const UUID = (stackMonitor) => ({
  generate: () => v4(),
});

module.exports = UUID;
