import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: process.env.VUE_APP_SERVER_URL + ':' + process.env.VUE_APP_SERVER_PORT
})

export default axiosInstance