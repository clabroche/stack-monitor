import io from 'socket.io-client'
import consola from 'consola'
const socket  = io(process.env.VUE_APP_SERVER_URL + ':' + process.env.VUE_APP_SOCKET_PORT)
socket.on('connect', function () {
  consola.log('Connection etablished')
});


export default socket