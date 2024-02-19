const express = require('express');
const axios = require('axios').default;

const router = express.Router();
module.exports = () => {
  router.post('/openapi/swagger.json', async (req, res) => {
    const { data } = await axios.get(req.body.url);
    res.json(data);
  });
  return router;
};
