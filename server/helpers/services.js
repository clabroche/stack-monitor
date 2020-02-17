const Stack = require('../models/stack')

module.exports = {
  findService(serviceLabel) {
    return Stack.stack.filter(s => s.label === serviceLabel)[0]
  }
}