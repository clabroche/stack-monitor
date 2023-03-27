const express = require('express');
const router = express.Router();

module.exports = {
  name: "OpenAI",
  icon: "fas fa-brain",
  placements: [
    {
      position: "toolbox",
      label: "OpenAi",
      icon: "fas fa-brain",
      goTo: { path: "/OpenAI" },
      active: "OpenAI",
    },
  ],
  order: 6,
  routes: router.use("/openai", require("./routes")),
};