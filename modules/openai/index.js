const express = require('express');
const router = express.Router();

/** @type {import('../views').PluginSM} */
const plugin = {
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
module.exports = plugin

/**
 * @typedef {Partial<
 * import('openai').ChatCompletionResponseMessage &
 * import('openai').CreateCompletionResponseUsage &
 * {
 *  created_at: string,
 * _id: string
 * }
 * >} OpenAiChat
 */