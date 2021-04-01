import axios from "../helpers/axios"
import Service from "./service"

function Stack () {
  /** @type {import('./service').default[]} */
  this.services = []
}

Stack.prototype.loadServices = async function () {
  const { data: services } = await axios.get('/stack')
  this.services = services.map(service => new Service(service))
  return this.services
}


Stack.prototype.launchServices = async function (stack) {
  await axios.post('/stack/choose', stack.map(service => service.label))
  return this.loadServices()
}
Stack.prototype.getService = async function(label) {
  if(!this.services.length) await this.loadServices()
  return this.services.filter(service => service.label === label).pop()
}

Stack.prototype.getEnabledServices = async function () {
  if(!this.services.length) await this.loadServices()
  return  this.services.filter(service => service.enabled)
}
export default new Stack()