const { v4 } = require('uuid');

module.exports.askUiFor = async function(label, data, RED) {
  const {sockets} = RED.settings.functionGlobalContext.stackmonitor
  return new Promise(resolve => {
    const uuid = v4()
    sockets.emit('node-red-' + label, {
      respondTo: uuid, data: data
    })
    const cb = (data) => {
      sockets.off(cb)
      resolve(data)
    }
    sockets.on(uuid, cb)
  })
}
