// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const _commandExists = require('command-exists');
const { execAsync } = require('./exec');

const commandExists = (cmd) => _commandExists(cmd).then(() => true).catch(() => false);

const { services, editor } = require('../views/views');
const {
  getAxios,
} = require('../networks/axios');
const Socket = require('../networks/Socket');

const findPorts = async () => {
  /** @type {string[]} */
  const ports = [];
  if (await commandExists('lsof')) {
    const lsof = await execAsync('lsof -i -n -P', {});
    const ports = lsof
      .trim().split('\n')
      .filter((line) => line.includes('stack-mon') && line.includes('LISTEN'))
      .map((line) => line.split(' ').map((a) => a.trim()).filter((a) => a).slice(-2)[0].split(':').pop());
    return ports;
  }
  if (await commandExists('netstat')) {
    try {
      const netstat = await execAsync('netstat -tlpn', {});
      const ports = netstat
        .trim().split('\n')
        .filter((line) => line.includes('stack-mon') && line.includes('LISTEN'))
        .map((line) => line.split('   ').map((a) => a.trim()).filter((a) => a)[2].split(':').pop());
      if (ports?.length) return ports;
    } catch (error) {
      console.error(error);
    }
  }
  return ports;
};

let connectInProgress = false;
module.exports = {
  isConnectInProgress: () => connectInProgress,
  /**
   * @param {vscode.ExtensionContext} context
   */
  connect: async (context) => {
    const ports = await findPorts();
    connectInProgress = true;
    let port;
    if (ports?.length) {
      port = await vscode.window.showQuickPick([
        ...ports,
        'Other',
      ]);
    }
    if (!port || port === 'Other') {
      port = await vscode.window.showInputBox({
        prompt: 'Which port to use',
        ignoreFocusOut: true,
      });
      if (!port) return;
    }

    context.globalState.setKeysForSync(['stackMonitorPort']);
    context.globalState.update('stackMonitorPort', port);
    await getAxios(context).get('/version')
      .then(async ({ data: version }) => {
        await module.exports.initSocket(context);
        context.globalState.update('stackMonitorAvailable', true);
        vscode.window.showInformationMessage(`Successfully connected to stack-monitor v${version}`);
      })
      .catch(() => {
        vscode.window.showInformationMessage('Can\'t connect to stack-monitor. Retry...');
        context.globalState.update('stackMonitorAvailable', false);
        module.exports.connect(context);
      })
      .finally(() => {
        connectInProgress = false;
      });
  },
  initSocket: async (context) => {
    await Socket.init(`http://localhost:${context.globalState.get('stackMonitorPort')}/socket`);
    services.update();
    editor.update(true);
    Socket.on('service:crash', async ({ label }) => {
      services.update();
      editor.update(true);
      vscode.window.showInformationMessage(`Service: ${label} crash`);
    });
    Socket.on('service:start', async ({ label }) => {
      services.update();
      editor.update(true);
      vscode.window.showInformationMessage(`Service: ${label} start`);
    });

    Socket.on('service:exit', async ({ label }) => {
      services.update();
      editor.update(true);
      vscode.window.showInformationMessage(`Service: ${label} exit`);
    });
    Socket.on('service:healthcheck:down', async ({ label }) => {
      services.update();
      editor.update(true);
    });
    Socket.on('service:healthcheck:up', async () => {
      services.update();
      editor.update(true);
    });
  },
};
