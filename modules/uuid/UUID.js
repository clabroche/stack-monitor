const { v4 } = require('uuid')

/** @param {import('../../typings/index').StackMonitor} stackMonitor */
const UUID = (stackMonitor) => {
  return {
    generate: () => v4()
  }
}

module.exports = UUID