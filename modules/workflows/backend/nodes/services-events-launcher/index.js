/** @param {import('node-red')} RED */
module.exports = function (RED) {
  const controller = function (config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const { sockets, stack } = RED.settings.functionGlobalContext.stackmonitor
    const filteredEvents = (config.events?.split(',') || []).filter(c => c)
    const filteredServices = (config.services?.split(',') || []).filter(c => c)
    ;[
      'service:start',
      'service:crash',
      'service:exit',
      'service:healthcheck:down',
      'service:healthcheck:up',
    ]
      .filter(event => ((!filteredEvents?.length) || filteredEvents.includes(event)))
      .map(event => {
        sockets.on(event, async ({label, pid, code}) => {
          if (filteredServices?.length && !filteredServices.includes(label)) return
          const service = stack.getServices().find(s => s.label === label)
          node.send({
            payload: {
              service,
              serviceLabel: label,
              event,
              pid,
              code,
            }
          })
        })
      })
  }

  RED.nodes.registerType("sm-services-events-launcher", controller)
}
