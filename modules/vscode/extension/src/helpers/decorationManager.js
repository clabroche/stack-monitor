// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
// eslint-disable-next-line import/no-unresolved
const { window } = require('vscode');

module.exports = class DecorationManager {
  constructor() {
    /** @type {import('vscode').DecorationOptions[]} */
    this.decorations = [];
    this.decorationType = window.createTextEditorDecorationType({ after: { margin: '0 0 0 0.5rem' } });
  }

  /**
   * @param {import('vscode').DecorationOptions[]} decorations
   * @param {import('vscode').DecorationOptions} decoration
   */
  updateDecoration(decorations, decoration) {
    const { line } = decoration.range.start;
    decorations = decorations.filter((dec) => dec.range.start.line !== line);
    decorations.push(decoration);
    return decorations;
  }

  /**
   * @param {import('vscode').TextEditorSelectionChangeEvent} e
   * @param {number[]} lines
   * @param {string} message
   */
  renderWaitDecorations(e, lines, message) {
    const decorations = lines.map((line) => this.setDecorations(e, line, message));
    this.renderDecorations(e, decorations);
    return decorations;
  }

  /**
   *
   * @param {import('vscode').TextEditorSelectionChangeEvent} e
   * @param {number} line
   * @param {string} text
   * @param {('error' | 'info') | undefined} [type]
   * @returns
   */
  setDecorations(e, line, text, type) {
    let color = '#888';
    if (type === 'error') { color = '#F40'; }
    if (type === 'info') { color = '#79F'; }
    /** @type {import('vscode').DecorationOptions} */
    const decoration = {
      renderOptions: { after: { contentText: text, color } },
      range: new vscode.Range(new vscode.Position(line, 1024), new vscode.Position(line, 1024)),
    };
    return decoration;
  }

  /**
   *
   * @param {import('vscode').TextEditorSelectionChangeEvent} e
   * @param {import('vscode').DecorationOptions[]} decorations
   */
  renderDecorations(e, decorations) {
    e.textEditor.setDecorations(this.decorationType, decorations);
  }
};
