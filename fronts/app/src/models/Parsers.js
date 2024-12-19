import axios from '../helpers/axios';

export default {
  async delete(id) {
    await axios.delete(`/parsers/${id}`);
  },
  async all() {
    const { data } = await axios.get('/parsers');
    return data;
  },
  async update(parser) {
    const { data } = await axios.put(`/parsers/${parser.id}`, parser);
    return data;
  },
  async create(parser) {
    const { data } = await axios.post('/parsers', parser);
    return data;
  },
};
