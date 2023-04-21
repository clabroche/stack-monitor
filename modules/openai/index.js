/** @type {import('../views').PluginSM<null>} */
const plugin = {
  name: "OpenAI",
  icon: "fas fa-brain",
  export: null,
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
  routes: require('./routes'),
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