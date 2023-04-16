const express = require("express");
const router = express.Router();

/** @type {import('../views').PluginSM} */
const plugin = {
  name: "NodeREPL",
  icon: "fab fa-node",
  placements: [
    {
      position: "toolbox",
      label: "Node Sandbox",
      icon: "fab fa-node",
      goTo: { path: "/NodeREPL" },
      active: "NodeREPL",
    },
  ],
  order: 6,
  routes: router.use("/node-repl", require("./routes")),
};
module.exports = plugin

