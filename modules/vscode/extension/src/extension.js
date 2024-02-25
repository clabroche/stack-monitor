// eslint-disable-next-line import/no-unresolved
const { initSocket } = require('./helpers/initialize');
const { registerCommands } = require('./commands/commands');
const { launchHeartBeat } = require('./schedule/heartbeat');
const { dependencies, editor, services } = require('./views/views');

let interval;

/**
 * @param {import('vscode').ExtensionContext} context
 */
async function activate(context) {
  console.log('Congratulations, your extension "stack-monitor" is now active!');
  await registerCommands(context);
  dependencies.initialize(context);
  editor.initialize(context);
  services.initialize(context);
  initSocket(context);
  launchHeartBeat(context);
}

// This method is called when your extension is deactivated
function deactivate() {
  clearInterval(interval);
}

module.exports = {
  activate,
  deactivate,
};
