import axios from '../helpers/axios'

function Stack(service) {
  this.updateFields(service)
}

Stack.prototype.updateFields = function (service = {}) {
  if (!service.label) throw new Error('A service should have a label')
  this.label = service.label
  this.description = service.description || ''
  this.url = service.url || ''
  this.git = service.git || {
    home: '',
    remote: '',
  }
  this.spawnCommand = service.spawnCommand || ''
  this.spawnOptions = service.spawnOptions || {
    cwd: '',
    env: ''
  }
  this.stack = []
  this.enabled = service.enabled || false
}
Stack.prototype.fetch = async function () {
  const { data: service } = await axios.get(`/stack/${this.label}`)
  this.updateFields(service)
  return this
}
Stack.getConfiguration = async function() {
  const {data: stack} = await axios.get('/stack/configuration')
  return stack
}
Stack.getCurrentStack = async function () {
  const { data: stack } = await axios.get('/stack')
  return stack
}
Stack.getEnabledServices = async function () {
  const { data: stack } = await axios.get('/stack')
  console.log(stack)
  return stack.filter(service => service.enabled)
}

Stack.setCurrentStack = async function(stack) {
  await axios.post('/stack/choose', stack.map(service => service.label))
  return Stack.getCurrentStack()
}

Stack.prototype.getLogs = async function() {
  const {data: logs} = await axios.get('/stack/'+this.label+'/logs')
  return logs
}

Stack.prototype.clear = async function() {
  const {data: logs} = await axios.delete('/stack/'+this.label+'/logs')
  return logs
}

Stack.prototype.openInVsCode = async function () {
  return axios.get('/stack/' + this.label + '/open-in-vs-code')
}

Stack.prototype.openFolder = async function () {
  return axios.get('/stack/' + this.label + '/open-folder')
}

Stack.prototype.restart = async function () {
  return axios.get('/stack/' + this.label + '/restart')
}
Stack.prototype.start = async function () {
  return axios.get('/stack/' + this.label + '/start')
}
Stack.prototype.stop = async function () {
  return axios.get('/stack/' + this.label + '/stop')
}

Stack.prototype.getBranches = async function () {
  const { data: branches } = await axios.get('/git/' + this.label + '/branches')
  return branches
}

Stack.prototype.getStatus = async function () {
  const { data: status } = await axios.get('/git/' + this.label + '/status')
  return status
}

Stack.prototype.changeBranch = async function (branchName) {
  await axios.post('/git/' + this.label + '/branch/' + branchName + '/change')
}

Stack.prototype.reset = async function () {
  await axios.delete('/git/' + this.label + '/reset')
}

Stack.prototype.checkoutFile = async function (file) {
  file = encodeURIComponent(file)
  await axios.delete('/git/' + this.label + '/checkout/' + file)
}

export default Stack