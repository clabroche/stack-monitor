/** @param {import('node-red')} RED */
module.exports = function (RED) {
  const controller = function (config) {
    RED.nodes.createNode(this, config);
    const node = this;
    if (!config.action) config.action = 'start'
    if (!config.service) config.service = 'STACK_LOAD_FROM_INPUT'
    const { sockets, stack } = RED.settings.functionGlobalContext.stackmonitor
    node.on('input', async function (msg) {
      const service = stack.getServices().find(s => {
        if (config.service === 'STACK_LOAD_FROM_INPUT') return s.label === (msg?.payload?.service?.label || msg?.service?.label)
        return s.label === config.service
      })
      if(!service) {
        node.status({ fill: "red", shape: "ring", text: "No service found" });
        return
      }
      if (config.action === 'start') {
        node.status({ fill: "green", shape: "dot", text: 'Restart ' + service.label + '...' });
        await service.restart()
        node.status({ fill: "green", shape: "dot", text: service.label + ' restarted' });
        return node.send(msg)
      } else if (config.action === 'stop') {
        node.status({ fill: "green", shape: "dot", text: 'Stop ' + service.label + '...' });
        await service.kill()
        node.status({ fill: "green", shape: "dot", text: service.label + ' Stopped' });
        return node.send(msg)
      } else {
        return node.status({ fill: "red", shape: "ring", text: `Action ${config.action} not available` });
      }

    })
  }

  RED.nodes.registerType("sm-service-action", controller)
}
