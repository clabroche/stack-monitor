// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const NodeDependenciesProvider = require('../providers/TreeProvider');
const CodelensProvider = require('../providers/CodeLensProvider');
const ServicesProvider = require('../providers/ServicesProvider');
const {
  getAxios, start, stop, restart, openUrl,
} = require('../networks/axios');

module.exports = {
  dependencies: {
    /** @type {import('vscode').ExtensionContext | null} */
    context: null,
    async update() {
      const file = vscode.window.activeTextEditor?.document.fileName;
      if (!file) return;
      vscode.window.createTreeView('dependencies', {
        treeDataProvider: new NodeDependenciesProvider(file),
      });
    },
    async initialize(context) {
      module.exports.dependencies.context = context;
      vscode.window.onDidChangeActiveTextEditor(async () => {
        module.exports.dependencies.update();
      });
      module.exports.dependencies.update();
    },
  },
  services: {
    /** @type {import('vscode').ExtensionContext | null} */
    context: null,
    async update() {
      const { context } = module.exports.services;
      ['services', 'services-explorer'].forEach((view) => {
        const tree = vscode.window.createTreeView(view, {
          treeDataProvider: new ServicesProvider(context),
        });
        tree.onDidChangeSelection(async (item) => {
          /** @type {{data: import('@clabroche/servers-server/models/Service'), type: string}} */
          const { data, type } = item.selection[0] || {};
          if (type === 'start-service') await start(data.label, context);
          if (type === 'stop-service') await stop(data.label, context);
          if (type === 'restart-service') await restart(data.label, context);
          if (type === 'openUrl') await openUrl(data.url, context);
        });
      });
    },
    async initialize(context) {
      module.exports.services.context = context;
      module.exports.services.update();
    },
  },
  editor: {
    /** @type {import('vscode').Disposable | null} */
    codeLensDisposable: null,
    /** @type {import('vscode').ExtensionContext | null} */
    context: null,
    async update(fetch = false) {
      const { context } = module.exports.editor;
      const file = vscode.window.activeTextEditor?.document.fileName;
      if (file) {
        if (fetch || !module.exports.cache) {
          const { data: services } = await getAxios(context).get('/vscode/get-services-from-file', { params: { file } })
            .catch((err) => {
              console.error(err);
              return { data: [] };
            });
          module.exports.cache = services;
        }
        const services = module.exports.cache;
        const crashedServices = services.filter((service) => service.enabled && (service.exited || service.crashed));
        if (crashedServices?.length) {
          const codelensProvider = new CodelensProvider(context, `${crashedServices.map((a) => a.label).join(', ')} ${crashedServices?.length > 1 ? 'are' : 'is'} down`);
          if (module.exports.editor.codeLensDisposable) {
            module.exports.editor.codeLensDisposable.dispose();
          }
          module.exports.editor.codeLensDisposable = vscode.languages.registerCodeLensProvider('*', codelensProvider);
          module.exports.editor.context.subscriptions.push(module.exports.editor.codeLensDisposable);
        } else if (module.exports.editor.codeLensDisposable) {
          module.exports.editor.codeLensDisposable.dispose();
        }
      }
    },
    /** @param {import('vscode').ExtensionContext} context */
    async initialize(context) {
      module.exports.editor.context = context;
      vscode.window.onDidChangeTextEditorSelection(async () => {
        module.exports.editor.update();
      });
    },
  },
};
