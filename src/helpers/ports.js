export default {
  // @ts-ignore
  // eslint-disable-next-line no-undef
  http: import.meta.env.VITE_HTTP_PORT ||  httpPort,
  // @ts-ignore
  // eslint-disable-next-line no-undef
  socket: import.meta.env.VITE_SOCKET_PORT ||  socketPort
}