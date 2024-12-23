// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const { connect } = require('../helpers/initialize');

module.exports = {
  async registerCommands(context) {
    const disposable = vscode.commands.registerCommand('stack-monitor.connect', () => connect(context));
    const disposableSnippet = vscode.commands.registerCommand('stack-monitor.log', async () => {
      const editor = vscode.window.activeTextEditor;
      const highlighted = editor.selections.map((selection) => {
        const selectionRange = new vscode.Range(
          selection.start.line,
          selection.start.character,
          selection.end.line,
          selection.end.character,
        );
        return editor.document.getText(selectionRange);
      }).filter((f) => f);

      const languages = {
        javascript: `console.log(JSON.stringify(['stack-monitor', ${highlighted?.length ? highlighted.join(', ') : '$1'}],(_, v) => (typeof v === 'function' ? \`[func]\` : v)));`,
        typescript: `console.log(JSON.stringify(['stack-monitor', ${highlighted?.length ? highlighted.join(', ') : '$1'}],(_, v) => (typeof v === 'function' ? \`[func]\` : v)));`,
        typescriptreact: `console.log(JSON.stringify(['stack-monitor', ${highlighted?.length ? highlighted.join(', ') : '$1'}],(_, v) => (typeof v === 'function' ? \`[func]\` : v)));`,
        json: '// cannot print into stack monitor from json. You can print only with dynamic language that print into shell console.',
        html: '// cannot print into stack monitor from html. You can print only with dynamic language that print into shell console.',
        css: '// cannot print into stack monitor from css. You can print only with dynamic language that print into shell console.',
        unknown: `// ${editor.document.languageId} language not supported for moment`,
      };
      const lastSelection = editor.selections
        .slice()
        .sort((a, b) => a.end.line - b.end.line)[editor.selections.length - 1];
      editor.selections = [lastSelection];
      await vscode.commands.executeCommand('editor.action.insertLineAfter');
      editor.insertSnippet(
        new vscode.SnippetString(
          languages[editor.document.languageId] || languages.unknown,
        ),
        lastSelection ? new vscode.Position(
          lastSelection.end.line + 1,
          lastSelection.start.character,
        ) : undefined,
      );
    });
    context.subscriptions.push(disposable, disposableSnippet);
  },
};
