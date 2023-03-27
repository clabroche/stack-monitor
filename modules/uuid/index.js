const express = require("express");
const router = express.Router();

module.exports = {
  name: "UUID",
  icon: "fas fa-random",
  placements: [
    {
      position: "sidebar",
      label: "UUID",
      icon: "fas fa-random",
      goTo: { path: "/UUID" },
      active: "uuid",
    },
    {
      position: "toolbox",
      label: "UUID",
      icon: "fas fa-random",
      goTo: { path: "/UUID" },
      active: "uuid",
    },
  ],
  order: 6,
  routes: router.use("/uuid", require("./routes")),
};
