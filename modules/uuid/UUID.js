const { v4 } = require('uuid')

/** @param {import('../../typings/export').StackMonitor} stackMonitor */
const UUID = (stackMonitor) => {
  return {
    generate: () => v4()
  }
}

module.exports = UUID