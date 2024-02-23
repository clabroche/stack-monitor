// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const { connect } = require('../helpers/initialize');

module.exports = {
  async registerCommands(context) {
    const disposable = vscode.commands.registerCommand('stack-monitor.connect', () => connect(context));
    const disposableSnippet = vscode.commands.registerCommand('stack-monitor.log', () => {
      vscode.window.activeTextEditor.insertSnippet(
        new vscode.SnippetString(
          "console.log(JSON.stringify(['$2stack-monitor', $1],(_, v) => (typeof v === 'function' ? `[func]` : v)));",
        ),
      );
    });
    context.subscriptions.push(disposable, disposableSnippet);
  },
};
