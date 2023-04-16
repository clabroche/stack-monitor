const express = require("express");
const router = express.Router();

/** @type {import('../views').PluginSM} */
const plugin = {
  name: "Mongo",
  icon: "fab fa-envira",
  placements: [
    {
      position: "toolbox",
      label: "Mongo",
      icon: "fab fa-envira",
      goTo: { path: "/Mongo" },
      active: "Mongo",
    },
  ],
  order: 6,
  routes: router.use("/mongo", require("./routes")),
};
module.exports = plugin

