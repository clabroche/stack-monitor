// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const { editor } = require('../views/views');
const { isAvailable } = require('../networks/axios');
const { isConnectInProgress } = require('../helpers/initialize');

module.exports = {
  /** @type {import('vscode').ExtensionContext | null} */
  context: null,
  async heartBeat() {
    const { context } = module.exports;
    if (!isConnectInProgress() && !await isAvailable(context)) {
      vscode.commands.executeCommand('setContext', 'stackMonitorAvailable', false);
    } else if (isConnectInProgress() && !await isAvailable(context)) {
      vscode.commands.executeCommand('setContext', 'stackMonitorAvailable', false);
    } else {
      vscode.commands.executeCommand('setContext', 'stackMonitorAvailable', true);
      editor.update();
    }
  },
  launchHeartBeat(context) {
    module.exports.context = context;
    setInterval(module.exports.heartBeat, 1000);
  },
};
