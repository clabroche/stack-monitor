/** @type {import('@clabroche/modules-plugins-loader/views').PluginSM<null>} */
const plugin = {
  name: "OpenAI",
  displayName: 'Open A.I.',
  description: 'Just chat with Chat GPT',
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
 * import('openai').OpenAI.ChatCompletionMessage &
 * import('openai').OpenAI.CompletionUsage &
 * {
 *  created_at: string,
 * _id: string
 * }
 * >} OpenAiChat
 */