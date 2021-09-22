import Axios from 'axios'
import ports from './ports'

const axios = Axios.create({
  baseURL: 'http://localhost:' + ports.http
})

export default axios