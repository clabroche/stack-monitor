const express = require("express");
const router = express.Router();

module.exports = {
  name: "Regex",
  icon: "fas fa-key",
  placements: [
    {
      position: "toolbox",
      label: "Regex",
      icon: "fas fa-key",
      goTo: { path: "/Regex" },
      active: "Regex",
    },
  ],
  order: 6,
  routes: router.use("/Regex", require("./routes")),
};
