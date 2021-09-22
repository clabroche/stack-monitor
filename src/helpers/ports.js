export default {
  // @ts-ignore
  // eslint-disable-next-line no-undef
  http: process.env.VUE_APP_HTTP_PORT ||  httpPort,
  // @ts-ignore
  // eslint-disable-next-line no-undef
  socket: process.env.VUE_APP_SOCKET_PORT ||  socketPort
}