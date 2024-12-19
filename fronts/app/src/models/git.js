import axios from '../helpers/axios';

export default {
  async isEnabled() {
    const { data } = await axios.get('/git/is-enabled');
    return data;
  },
};
