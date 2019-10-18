import axios from '../helpers/axios'

function System() {
  this.infos = {
    cpu: 0,
    mem: 0,
  }
  this.globalInfos = {
    nbCpus: 0,
    totalmem: 0,
    freemem: 0,
    memPercentage: 0
  }
}
System.prototype.getInfos = async function(serviceLabel) {
  const {data: infos} = await axios.get('/system/'+serviceLabel+'/infos')
  this.infos = infos
  return this.infos
}
System.prototype.getGlobalInfos = async function() {
  const {data: globalInfos} = await axios.get('/system/global-infos')
  this.globalInfos = globalInfos
  return this.globalInfos
}
System.prototype.disconnect = async function() {
  return axios.get('/system/disconnect')
}

export default new System()