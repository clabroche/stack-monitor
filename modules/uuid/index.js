const express = require("express");
const router = express.Router();

/** @type {import('../views').PluginSM} */
module.exports = {
  name: "UUID",
  icon: "fas fa-random",
  placements: [
    {
      position: "toolbox",
      label: "UUID",
      icon: "fas fa-random",
      goTo: { path: "/UUID" },
      active: "UUID",
    },
  ],
  order: 6,
  routes: router.use("/uuid", require("./routes")),
};
