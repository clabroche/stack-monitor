const express = require('express');
const router = express.Router();

module.exports = {
  name: 'Documentation',
  icon: 'fas fa-book',
  placements: ['service'],
  order: 6,
  hidden: (service) => !service.documentation, 
  routes: router.use("/documentation", require("./routes")),
}