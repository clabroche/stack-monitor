const express = require("express");
const router = express.Router();

/** @type {import('../views').PluginSM} */
const plugin = {
  name: "Global scripts",
  icon: "fas fa-columns",
  placements: [
    {
      position: "dev-ops",
      label: "Global scripts",
      iconText: "{}",
      goTo: { path: "/GlobalScripts" },
      active: "GlobalScripts",
    },
  ],
  routes: router.use("/global-scripts", require("./routes")),
};
module.exports = plugin