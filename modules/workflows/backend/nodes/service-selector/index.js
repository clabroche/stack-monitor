const { askUiFor } = require('../helpers/socket');

/** @param {import('node-red')} RED */
module.exports = function (RED) {
  const serviceSelector = function (config) {
    RED.nodes.createNode(this, config);
    var node = this;
    node.on('input', async function (msg) {
      const { stack } = RED.settings.functionGlobalContext.stackmonitor

      if (!msg.payload) msg.payload = {}
      const service = await askUiFor('selector', {
        ui: {
          header: 'Service Selector',
          optionLabel: "label",
          optionValue: "",
        },
        data: config.serviceEnabled ? stack.getEnabledServices() : stack.getServices()
      }, RED);
      if(!service) {
        node.status({ fill: "red", shape: "ring", text: "No service selected by user" });
        return 
      }
      node.status({ fill: "green", shape: "dot", text: service.label });
      const isObject = obj => obj === Object(obj) && !Array.isArray(obj);
      if(isObject(msg.payload)) msg.payload.service = service
      else msg.payload = {service}
      node.send(msg);
    });
  }
  RED.nodes.registerType("sm-service-selector", serviceSelector);
}
