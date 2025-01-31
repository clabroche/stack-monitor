import { onBeforeUnmount } from 'vue';
import Socket from '../../../../../fronts/app/src/helpers/Socket'

export const reactTo = (label, cb) => {
  Socket.on('node-red-' + label, async ({ respondTo, data }) => {
    const result = await cb(data)
    Socket.socket.emit(respondTo, result);
  });
  onBeforeUnmount(() => { Socket.off('node-red-' + label, cb) })
}