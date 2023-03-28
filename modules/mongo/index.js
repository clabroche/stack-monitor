const express = require("express");
const router = express.Router();

module.exports = {
  name: "Mongo",
  icon: "fas fa-leaf",
  placements: [
    {
      position: "toolbox",
      label: "Mongo",
      icon: "fas fa-leaf",
      goTo: { path: "/Mongo" },
      active: "Mongo",
    },
  ],
  order: 6,
  routes: router.use("/mongo", require("./routes")),
};
