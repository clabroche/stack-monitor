import io from 'socket.io-client'
import consola from 'consola'
import ports from './ports';
const socket = io('http://localhost:' + ports.socket)
socket.on('connect', function () {
  consola.log('Connection etablished')
});


export default socket