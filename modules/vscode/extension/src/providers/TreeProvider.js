/* eslint-disable max-classes-per-file */
// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const findPackageJson = (_path) => {
  if (path.resolve(_path) === path.resolve('/')) return '';
  if (fs.existsSync(path.resolve(_path, 'package.json'))) return _path;
  return findPackageJson(path.resolve(_path, '..'));
};

module.exports = class NodeDependenciesProvider {
  constructor(workspaceRoot) {
    this.workspaceRoot = findPackageJson(workspaceRoot);
  }

  getTreeItem(element) {
    return element;
  }

  async getChildren(element) {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace');
      return [];
    }

    if (element) {
      return [
        ...await this.getDepsInPackageJson(
          path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json'),
        ) || [],
        ...await this.getDepsInPackageJson(
          path.join(vscode.workspace.workspaceFolders[0].uri.path, 'node_modules', element.label, 'package.json'),
        ) || [],
      ];
    }
    const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
    if (this.pathExists(packageJsonPath)) {
      return this.getDepsInPackageJson(packageJsonPath);
    }
    const packageJsonPathRoot = path.join(vscode.workspace.workspaceFolders[0].uri.path, 'package.json');
    if (this.pathExists(packageJsonPathRoot)) {
      return this.getDepsInPackageJson(packageJsonPathRoot);
    }
    vscode.window.showInformationMessage('Workspace has no package.json');
    return [];
  }

  /**
   * Given the path to package.json, read all its dependencies and devDependencies.
   */
  getDepsInPackageJson(packageJsonPath) {
    if (this.pathExists(packageJsonPath)) {
      const toDep = (moduleName, version) => {
        if (this.pathExists(path.join(this.workspaceRoot, 'node_modules', moduleName))) {
          return new Dependency(
            moduleName,
            version,
            vscode.TreeItemCollapsibleState.Collapsed,
          );
        }
        if (this.pathExists(path.join(vscode.workspace.workspaceFolders[0].uri.path, 'node_modules', moduleName))) {
          return new Dependency(
            moduleName,
            version,
            vscode.TreeItemCollapsibleState.Collapsed,
          );
        }
        return new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.None);
      };

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      const deps = packageJson.dependencies
        ? Object.keys(packageJson.dependencies).map((dep) => toDep(dep, packageJson.dependencies[dep]))
        : [];
      const devDeps = packageJson.devDependencies
        ? Object.keys(packageJson.devDependencies).map((dep) => toDep(dep, packageJson.devDependencies[dep]))
        : [];
      return deps.concat(devDeps);
    }
    return [];
  }

  pathExists(p) {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }
    return true;
  }
};

class Dependency extends vscode.TreeItem {
  constructor(
    label,
    version,
    collapsibleState,
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.version}`;
    this.version = version;
    this.description = this.version;
  }
}
