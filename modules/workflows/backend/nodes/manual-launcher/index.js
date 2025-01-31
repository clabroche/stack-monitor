/** @param {import('node-red')} RED */
module.exports = function (RED) {
  const controller = function (config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const { sockets, stack } = RED.settings.functionGlobalContext.stackmonitor
    sockets.on(config.id, async (eventConfig, data) => {
      node.status({ fill: "green", shape: "dot", text: `${new Date().toISOString()} - ${eventConfig.launchType} - ${data}` });
      node.send({
        payload: {
          ...(eventConfig.launchType === 'services'
              ? {
                service: stack.getServices().find(s => s.label === data)
              }
              : {}
          ),
        }
      })
    })
  }

  RED.nodes.registerType("sm-manual-launcher", controller)
}
