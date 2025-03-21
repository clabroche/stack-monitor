
/** @param {import('node-red')} RED */
module.exports = function (RED) {
  const controller = function (config) {
    RED.nodes.createNode(this, config);
    const node = this;
    if (!config.commandId) config.commandId = 'STACK_LOAD_FROM_INPUT'
    const { sockets, stack } = RED.settings.functionGlobalContext.stackmonitor
    node.on('input', async function (msg) {
      try {
        let command, service
        stack.getServices().forEach(_service => {
          [..._service.commands, ..._service.shortcuts].forEach(_command => {
            if (_command.id === config.commandId) {
              command = _command
              service = _service
            }
          });
        });
        if(!command) {
          node.status({ fill: "red", shape: "ring", text: "No command found" });
          return
        }
        const axios = await stack.getAxios({})
        await axios.post(`/logs/${service.label}/prompt`, { command, service: service.label })
        node.status({ fill: "green", shape: "ring", text: `OK - ${new Date().toISOString()}` });
        return node.send(msg)
      } catch (err) {
        node.error(err + (err?.stack || ''))
        node.status({ fill: "red", shape: "ring", text: err?.message || err });
      }
    })
  }

  RED.nodes.registerType("sm-run-command", controller)
}
