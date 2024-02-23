// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const { services, editor } = require('../views/views');
const {
  getAxios,
} = require('../networks/axios');
const Socket = require('../networks/Socket');

let connectInProgress = false;
module.exports = {
  isConnectInProgress: () => connectInProgress,
  /**
   * @param {vscode.ExtensionContext} context
   */
  connect: async (context) => {
    connectInProgress = true;
    // The code you place here will be executed every time your command is executed
    const port = await vscode.window.showInputBox({ prompt: 'Which port to use', ignoreFocusOut: true });
    if (!port) return;
    context.globalState.setKeysForSync(['stackMonitorPort']);
    context.globalState.update('stackMonitorPort', port);
    await getAxios(context).get('/version')
      .then(async ({ data: version }) => {
        await module.exports.initSocket(context);
        context.globalState.update('stackMonitorAvailbale', true);
        vscode.window.showInformationMessage(`Successfully connected to stack-monitor v${version}`);
      })
      .catch(() => {
        vscode.window.showInformationMessage('Can\'t connect to stack-monitor. Retry...');
        context.globalState.update('stackMonitorAvailbale', false);
        module.exports.connect(context);
      })
      .finally(() => {
        connectInProgress = false;
      });
  },
  initSocket: async (context) => {
    await Socket.init(`http://localhost:${context.globalState.get('stackMonitorPort')}`);
    services.update();
    editor.update(true);
    Socket.socket.on('service:crash', async ({ label }) => {
      services.update();
      editor.update(true);
      vscode.window.showInformationMessage(`Service: ${label} crash`);
    });
    Socket.socket.on('service:start', async ({ label }) => {
      services.update();
      editor.update(true);
      vscode.window.showInformationMessage(`Service: ${label} start`);
    });

    Socket.socket.on('service:exit', async ({ label }) => {
      services.update();
      editor.update(true);
      vscode.window.showInformationMessage(`Service: ${label} exit`);
    });
    Socket.socket.on('service:healthcheck:down', async ({ label }) => {
      services.update();
      editor.update(true);
      vscode.window.showInformationMessage(`Service: ${label} healthcheck:down`);
    });
    Socket.socket.on('service:healthcheck:up', async () => {
      services.update();
      editor.update(true);
    });
  },
};
