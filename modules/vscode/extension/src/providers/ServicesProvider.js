/* eslint-disable max-classes-per-file */
// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const PromiseB = require('bluebird');
const { getAxios } = require('../networks/axios');

/** @param {import('@clabroche/servers-server/models/Service')} service */
function getLabel(service) {
  let status = '';
  if (service.crashed) status = '🗰';
  else if (service.enabled && !service.exited) status = '⏵';
  else if (service.exited) status = '🗙';
  else status = '■';
  return `${status} ${service.label}`;
}
module.exports = class ServicesProvider {
  constructor(context) {
    this.workspaceRoot = __dirname;
    this.context = context;
  }

  getTreeItem(element) {
    return element;
  }

  async getChildren(element) {
    if (!element) {
      const { data: services } = await getAxios(this.context).get('/stack/services');
      services.sort((a, b) => ((b.enabled ? 1 : 0) - (a.enabled ? 1 : 0)));
      return PromiseB.mapSeries(services, (service) => new Dependency({
        label: getLabel(service),
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        type: 'service',
        tooltip: service.description,
        data: service,
      }));
    }
    if (element.type === 'service') return this.fillService(element);
    if (element.type === 'envs') return this.fillEnvs(element);
    if (element.type === 'actions') return this.fillActions(element);
    if (element.type === 'commands') return this.fillCommands(element);
    if (element.type === 'command') return this.fillCommand(element);
    if (element.type === 'urls') return this.fillUrls(element);
    return [];
  }

  async fillService(element) {
    /** @type {{data: import('@clabroche/servers-server/models/Service')}} */
    const { data: service } = await getAxios(this.context).get(`/stack/${element.data.label}`);
    return [
      new Dependency({
        label: service.rootPath,
        tooltip: service.rootPath,
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        type: 'rootPath',
      }),
      new Dependency({
        label: 'Actions',
        tooltip: 'Actions',
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        type: 'actions',
        data: service,
      }),
      new Dependency({
        label: 'Commands',
        tooltip: 'Commands',
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        type: 'commands',
        data: service,
      }),
      new Dependency({
        label: 'Urls',
        tooltip: 'Urls',
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        type: 'urls',
        data: service,
      }),

    ];
  }

  async fillEnvs(element) {
    /** @type {import('@clabroche/servers-server/models/Service')} */
    const service = element.data;
    const envs = service.spawnOptions.env || {};
    return [
      ...Object.keys(envs).map((key) => (
        new Dependency({
          label: key,
          version: envs[key],
          collapsibleState: vscode.TreeItemCollapsibleState.None,
          type: 'env',
        })
      )),
    ];
  }

  async fillActions(element) {
    /** @type {import('@clabroche/servers-server/models/Service')} */
    const service = element.data;
    return [
      new Dependency({
        label: 'Start',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        type: 'start-service',
        data: service,
      }),
      new Dependency({
        label: 'Stop',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        type: 'stop-service',
        data: service,
      }),
      new Dependency({
        label: 'Restart',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        type: 'restart-service',
        data: service,
      }),
    ];
  }

  async fillCommands(element) {
    /** @type {import('@clabroche/servers-server/models/Service')} */
    const service = element.data;
    return [
      new Dependency({
        label: `${service.spawnCmd} ${(service.spawnArgs || []).join(' ')}`,
        tooltip: `${service.spawnCmd} ${(service.spawnArgs || []).join(' ')}`,
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        type: 'command',
        data: service,
      }),
      ...(service.commands || []).map((command) => (
        new Dependency({
          label: `${command.spawnCmd} ${(command.spawnArgs || []).join(' ')}`,
          tooltip: `${command.spawnCmd} ${(command.spawnArgs || []).join(' ')}`,
          collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
          type: 'command',
          data: service,
        })
      )),
    ];
  }

  async fillCommand(element) {
    /** @type {import('@clabroche/servers-server/models/Service')} */
    const service = element.data;
    return [
      new Dependency({
        label: 'Envs',
        tooltip: 'Envs',
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        type: 'envs',
        data: service,
      }),
    ];
  }

  async fillUrls(element) {
    /** @type {import('@clabroche/servers-server/models/Service')} */
    const service = element.data;
    const { url } = service;
    return [
      ...url ? [new Dependency({
        label: url,
        tooltip: url,
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        type: 'openUrl',
        data: { service, url },
      })] : [],
      ...(service.urls || []).map((url) => (
        new Dependency({
          label: url,
          tooltip: url,
          collapsibleState: vscode.TreeItemCollapsibleState.None,
          type: 'openUrl',
          data: { service, url },
        })
      )),
    ];
  }
};

class Dependency extends vscode.TreeItem {
  /**
   * @param {{
   *  label: string,
   *  version?: string,
   *  collapsibleState: any,
   *  type: string,
   *  data?: any,
   *  tooltip?: string,
   *  command?: import('vscode').Command
   * }} param0
   */
  constructor({
    label,
    version,
    collapsibleState,
    type,
    data,
    tooltip,
    command,
  }) {
    super(label, collapsibleState);
    this.tooltip = tooltip;
    this.version = version;
    this.description = this.version;
    this.type = type;
    this.data = data;
    this.command = command;
  }
}
