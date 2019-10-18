import axios from '../helpers/axios'

function Stack() {
  this.stack = []
  this.stackConfiguration = []
  
}
Stack.prototype.getConfiguration = async function() {
  const {data: stackConfiguration} = await axios.get('/stack/configuration')
  this.stackConfiguration = stackConfiguration
  return this.stackConfiguration
}
Stack.prototype.getCurrentStack = async function() {
  const {data: stack} = await axios.get('/stack')
  this.stack = stack
  return this.stack
}

Stack.prototype.setCurrentStack = async function() {
  await axios.post('/stack/choose', this.stack)
  return this.getCurrentStack()
}

Stack.prototype.getLogs = async function(serviceLabel) {
  const {data: logs} = await axios.get('/stack/'+serviceLabel+'/logs')
  return logs
}

Stack.prototype.clear = async function(serviceLabel) {
  const {data: logs} = await axios.delete('/stack/'+serviceLabel+'/logs')
  return logs
}
Stack.prototype.openInVsCode = async function(serviceLabel) {
  return axios.get('/stack/'+serviceLabel+'/open-in-vs-code')
}

Stack.prototype.restart = async function(serviceLabel) {
  return axios.get('/stack/'+serviceLabel+'/restart')
}

export default new Stack()