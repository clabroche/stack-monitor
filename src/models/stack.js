import axios from '../helpers/axios'

function Stack(service) {
  this.updateFields(service)
}

Stack.prototype.updateFields =function(service = {}) {
  if (!service.label) throw new Error('A service should have a label')
  this.label = service.label || ''
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
  this.stackConfiguration = []
}
Stack.prototype.fetch = async function () {
  const { data: service } = await axios.get(`/stack/${this.label}`)
  this.updateFields(service)
  return this
}
Stack.getConfiguration = async function() {
  const {data: stackConfiguration} = await axios.get('/stack/configuration')
  return stackConfiguration
}
Stack.getCurrentStack = async function() {
  const {data: stack} = await axios.get('/stack')
  return stack
}

Stack.setCurrentStack = async function(stack) {
  await axios.post('/stack/choose', stack)
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

Stack.prototype.restart = async function() {
  return axios.get('/stack/'+this.label+'/restart')
}

Stack.prototype.getBranches = async function () {
  const { data: branches } = await axios.get('/git/' + this.label + '/branches')
  this.branches = branches
  return this.branches
}

Stack.prototype.getStatus = async function () {
  const { data: status } = await axios.get('/git/' + this.label + '/status')
  this.status = status
  return this.status
}

export default Stack