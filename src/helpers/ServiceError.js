import Socket from "./Socket"
import notif from "./notification"

Socket.socket.on('alert', _notif => {
  notif.next(_notif.type || 'error', _notif.message, _notif.label)
})

export default {}