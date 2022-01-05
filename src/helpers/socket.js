import io from 'socket.io-client'
import ports from './ports';
const socket = io('http://localhost:' + ports.socket)
socket.on('connect', function () {
  console.log('Connection etablished')
});


export default socket