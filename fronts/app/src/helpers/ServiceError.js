import Socket from "./Socket"
import notif from "./notification"

Socket.on('alert', _notif => {
  notif.next(_notif.type || 'error', _notif.message, _notif.label, null, _notif.commandId)
})

export default {}