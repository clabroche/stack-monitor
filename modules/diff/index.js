const express = require("express");
const router = express.Router();

/** @type {import('../views').PluginSM} */
const plugin = {
  name: "Diff",
  icon: "fas fa-columns",
  placements: [
    {
      position: "toolbox",
      label: "Diff",
      icon: "fas fa-columns",
      goTo: { path: "/Diff" },
      active: "Diff",
    },
  ],
  order: 6,
  routes: router.use("/diff", require("./routes")),
};
module.exports = plugin