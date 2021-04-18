import socket from "./socket"
import notif from "./notification"

socket.on('alert', _notif => {
  notif.next(_notif.type || 'error', _notif.message, _notif.label)
})

export default {}