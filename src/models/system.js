import { reactive } from '@vue/reactivity'
import axios from '../helpers/axios'
import Axios from 'axios'

function System() {
  this.infos = reactive({
    cpu: 0,
    mem: 0,
  })
  this.globalInfos = reactive({
    nbCpus: 0,
    totalmem: 0,
    freemem: 0,
    memPercentage: 0,
    cpu: 0
  })
  this.version = '0.0.0'
}
/** @param {string} serviceLabel */
System.prototype.getInfos = async function (serviceLabel) {
  const { data: infos } = await axios.get('/system/' + serviceLabel + '/infos')
  this.infos = infos
  return this.infos
}
System.prototype.getVersion = async function () {
  const { data: version } = await axios.get('/version')
  this.version = version
  return this.version
}
System.prototype.disconnect = async function() {
  return axios.get('/system/disconnect')
}
System.prototype.hasUpdate = async function () {
  try {
    const localVersion = await this.getVersion()
    /** @type {{data: {name: string}[]}} */
    const { data: remoteVersions} = await Axios.get('https://api.github.com/repos/clabroche/stack-monitor/tags')
    const remoteVersion = remoteVersions.map(version => version.name)[0].substring(1)
    return {
      local: localVersion,
      remote: remoteVersion,
      hasUpdate: localVersion !== remoteVersion
    }
  } catch (error) {
    if(error?.response?.status === 403) return null
    console.error(error)
  }
  return null
}
export default new System()