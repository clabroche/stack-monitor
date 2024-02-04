import axios from 'axios';

export default {
  instance: axios.create({
    baseURL: `${process.env.VUE_APP_SERVER_URL}`,
  }),
};
