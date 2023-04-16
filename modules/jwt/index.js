const express = require("express");
const router = express.Router();

/** @type {import('../views').PluginSM} */
const plugin = {
  name: "JWT",
  icon: "fas fa-key",
  placements: [
    {
      position: "toolbox",
      label: "JWT",
      icon: "fas fa-key",
      goTo: { path: "/JWT" },
      active: "JWT",
    },
  ],
  order: 6,
  routes: router.use("/JWT", require("./routes")),
};
module.exports = plugin