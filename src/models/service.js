import axios from '../helpers/axios'

function Service(service) {
  this.updateFields(service)
}

Service.prototype.updateFields = function (service = {}) {
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
  this.enabled = service.enabled || false
}
Service.prototype.fetch = async function () {
  const service = Service.stack.filter(service => service.label === this.label).pop()
  this.updateFields(service)
  return this
}
Service.getConfiguration = async function() {
  const {data: stack} = await axios.get('/stack/configuration')
  return stack
}

Service.getEnabledServices = async function () {
  const { data: stack } = await axios.get('/stack')
  return stack.filter(service => service.enabled)
}



Service.prototype.getLogs = async function() {
  const {data: logs} = await axios.get('/stack/'+this.label+'/logs')
  return logs
}

Service.prototype.clear = async function() {
  const {data: logs} = await axios.delete('/stack/'+this.label+'/logs')
  return logs
}

Service.prototype.openInVsCode = async function () {
  return axios.get('/stack/' + this.label + '/open-in-vs-code')
}

Service.prototype.openFolder = async function () {
  return axios.get('/stack/' + this.label + '/open-folder')
}

Service.prototype.restart = async function () {
  this.enabled = true
  return axios.get('/stack/' + this.label + '/restart')
}
Service.prototype.start = async function () {
  this.enabled = true
  return axios.get('/stack/' + this.label + '/start')
}
Service.prototype.stop = async function () {
  this.enabled = false
  return axios.get('/stack/' + this.label + '/stop')
}

Service.prototype.getBranches = async function () {
  const { data: branches } = await axios.get('/git/' + this.label + '/branches')
  return branches
}

Service.prototype.getStatus = async function () {
  const { data: status } = await axios.get('/git/' + this.label + '/status')
  return status
}

Service.prototype.changeBranch = async function (branchName) {
  await axios.post('/git/' + this.label + '/branch/' + branchName + '/change')
}

Service.prototype.reset = async function () {
  await axios.delete('/git/' + this.label + '/reset')
}

Service.prototype.checkoutFile = async function (file) {
  file = encodeURIComponent(file)
  await axios.delete('/git/' + this.label + '/checkout/' + file)
}

export default Service