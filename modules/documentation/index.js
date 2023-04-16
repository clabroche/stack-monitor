const express = require('express');
const router = express.Router();

/** @type {import('../views').PluginSM} */
const plugin = {
  name: 'Documentation',
  icon: 'fas fa-book',
  placements: ['service'],
  order: 6,
  /** @param {import('../../server/models/Service')} service*/
  hidden: (service) => !service.documentation, 
  routes: router.use("/documentation", require("./routes")),
}
module.exports = plugin

/**
 * @typedef {{
 *  name: string,
 *  isDir: boolean,
 *  path: string,
 *  ext: string,
 *  children:Leaf[] | null
 * }} Leaf
 */