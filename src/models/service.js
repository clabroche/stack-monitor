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

Service.prototype.isNpm = async function () {
  const { data: isNpm } = await axios.get('/npm/' + this.label)
  return isNpm
}

Service.prototype.getPackageJSON = async function () {
  const { data: packageJSON } = await axios.get('/npm/' + this.label + '/packagejson')
  return packageJSON
}

Service.prototype.runNpmCommand = async function (command) {
  const { data: socket } = await axios.get('/npm/' + this.label + '/run/' + encodeURIComponent(command))
  return socket
}

export default Service