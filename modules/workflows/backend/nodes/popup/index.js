const { askUiFor } = require('../helpers/socket');

/** @param {import('node-red')} RED */
module.exports = function (RED) {
  const serviceSelector = function (config) {
    RED.nodes.createNode(this, config);
    var node = this;
    node.on('input', async function (msg) {
      if (!msg.payload) msg.payload = {}
      const service = await askUiFor('displayPopup', {
        ui: {
          header: config.header,
          html: msg.payload.toDisplay
        },
      }, RED);
      node.status({ fill: "green", shape: "dot", text: 'Displayed' });
      node.send(msg);
    });
  }
  RED.nodes.registerType("sm-popup", serviceSelector);
}
