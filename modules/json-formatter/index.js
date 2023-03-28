const express = require("express");
const router = express.Router();

module.exports = {
  name: "JSON-formatter",
  icon: "fas fa-random",
  placements: [
    {
      position: "toolbox",
      label: "JSON",
      iconText: "{}",
      goTo: { path: "/JSONFormatter" },
      active: "JSON-formatter",
    },
  ],
  order: 6,
  routes: router.use("/json-formatter", require("./routes")),
};
