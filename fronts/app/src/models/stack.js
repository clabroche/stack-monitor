import { ref } from 'vue';
import axios from '../helpers/axios';
import Service from './service';
import Socket from '../helpers/Socket';

function Stack() {
  /** @type {import('vue').Ref<import('./service').default[]>} */
  this.services = ref([]);
  Socket.socket.on('conf:update', (/** @type {string[]} */data) => {
    if (data.length) {
      data.forEach((label) => {
        const service = this.services.value.find((_service) => _service.label === label);
        if (service) service.fetch();
      });
    }
  });
}

Stack.prototype.loadServices = async function () {
  /** @type {{data: import('./service').default[]}} */
  const { data: services } = await axios.get('/stack/services');
  this.services.value = services.filter((s) => s).map((service) => new Service(service));
  return this.services.value;
};

Stack.prototype.getEnvironment = async function () {
  const { data: environment } = await axios.get('/stack/environment');
  return environment;
};

Stack.prototype.getAdditionalThemes = async function () {
  const { data: additionalThemes } = await axios.get('/stack/additional-themes');
  return additionalThemes;
};

Stack.prototype.getEnvironments = async function () {
  const { data: environments } = await axios.get('/stack/environments');
  return environments;
};
/** @param {string} environment */
Stack.prototype.changeEnvironment = async function (environment) {
  const { data: environments } = await axios.post('/stack/environment', { environment });
  return environments;
};

Stack.prototype.getAllConfsPath = async function () {
  const { data: paths } = await axios.get('/stack/all-confs-path');
  return paths;
};
/** @param {string} path */
Stack.prototype.selectConf = async function (path) {
  await axios.post('/stack/select-conf/', { path });
};
/** @param {string} path */
Stack.prototype.deleteConf = async function (path) {
  await axios.post('/stack/delete-conf/', { path });
};

/** @param {{label?: string, enabled?: boolean}[]} services */
Stack.prototype.launchServices = async function (services) {
  await axios.post('/stack/choose', services);
  return this.loadServices();
};
/** @param {string} label */
Stack.prototype.getService = async function (label) {
  if (!this.services.value.length) await this.loadServices();
  return this.services.value.filter((service) => service.label === label).pop();
};

Stack.prototype.getEnabledServices = async function () {
  if (!this.services.value.length) await this.loadServices();
  return this.services.value.filter((service) => service.enabled);
};
export default new Stack();
