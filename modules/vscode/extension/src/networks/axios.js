// eslint-disable-next-line import/no-unresolved
const axios = require('axios');

const getAxios = (context) => axios.create({ baseURL: `http://localhost:${context.globalState.get('stackMonitorPort')}` });

/** @param {import('vscode').ExtensionContext} context */
module.exports = {
  getAxios,
  restart: async (label, context) => getAxios(context).get(`/stack/${label}/restart`),
  start: async (label, context) => getAxios(context).get(`/stack/${label}/start`),
  stop: async (label, context) => getAxios(context).get(`/stack/${label}/stop`),
  openUrl: async (url, context) => getAxios(context).get('/vscode/open-url', { params: { url } }),
  isAvailable: async (context) => {
    const { data: version } = await getAxios(context).get('/version').catch((error) => { console.error(error); return { data: null }; });
    return !!version;
  },

};
