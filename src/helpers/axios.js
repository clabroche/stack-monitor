import Axios from 'axios'

const axios = Axios.create({
  baseURL: process.env.VUE_APP_SERVER_URL + ':' + process.env.VUE_APP_SERVER_PORT
})

export default axios