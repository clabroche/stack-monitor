import axios from '../helpers/axios'

export default {
  /** @param {string} path */
  async outdated(path) {
    const { data } = await axios.get(`/fs/outdated?path=${path}`)
    return data
  },
  async homeDir() {
    const { data } = await axios.get(`/fs/home-dir`)
    return data
  },
  /** @param {string} path */
  async ls(path) {
    const { data } = await axios.get(`/fs/ls?path=${path}`)
    return data
  }
}