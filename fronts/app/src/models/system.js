import { reactive, ref } from 'vue';
import axios from '../helpers/axios';
const a = "fzmfzemfkzefmzek"
function System() {
  this.infos = reactive({
    cpu: 0,
    mem: 0,
  });
  this.globalInfos = reactive({
    nbCpus: 0,
    totalmem: 0,
    freemem: 0,
    memPercentage: 0,
    cpu: 0,
  });
  this.version = ref('0.0.0');
}
/** @param {string} serviceLabel */
System.prototype.getInfos = async function (serviceLabel) {
  const { data: infos } = await axios.get(`/system/${serviceLabel}/infos`);
  this.infos = infos;
  return this.infos;
};

System.prototype.proxyImg = function (url) {
  const baseUrl = axios.defaults.baseURL === '/'
    ? ''
    : axios.defaults.baseURL;
  return `${baseUrl}/system/proxy-img?url=${encodeURIComponent(url)}`;
};
System.prototype.getVersion = async function () {
  const { data: version } = await axios.get('/version');
  this.version.value = version;
  return this.version.value;
};
System.prototype.disconnect = async function () {
  return axios.get('/system/disconnect');
};
System.prototype.hasUpdate = async function () {
  const { data } = await axios.get('/stack/has-update');
  return data;
};
export default new System();
