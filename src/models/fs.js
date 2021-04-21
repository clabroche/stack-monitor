import axios from '../helpers/axios'

export default {
  // openDir() {
  //   return axios.get(`/fs/open-dir`)
  // },
  // recursiveImport(path) {
  //   return axios.get(`/fs/import/recursive?path=${path}`)
  // },
  // import(path) {
  //   return axios.get(`/fs/import?path=${path}`)
  // },
  async outdated(path) {
    const { data } = await axios.get(`/fs/outdated?path=${path}`)
    return data
  },
  async homeDir() {
    const { data } = await axios.get(`/fs/home-dir`)
    return data
  },
  async ls(path) {
    const { data } = await axios.get(`/fs/ls?path=${path}`)
    return data
  }
}