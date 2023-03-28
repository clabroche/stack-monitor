const express = require("express");
const router = express.Router();

module.exports = {
  name: "JWT",
  icon: "fas fa-random",
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
