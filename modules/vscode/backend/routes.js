const express = require('express');
const open = require('open');
const pathfs = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const ws = require('workspace-tools');
const { execAsync } = require('../../../servers/server/helpers/exec');

const router = express.Router();

/** @param {import('@clabroche/common-typings').StackMonitor} stackMonitor */
const routes = (stackMonitor) => {
  router.post('/vscode/install', async (req, res) => {
    await execAsync('code --install-extension ./stack-monitor.vsix', { cwd: __dirname });
    res.send('ok');
  });
  router.delete('/vscode/uninstall', async (req, res) => {
    await execAsync('code --uninstall-extension clabroche.stack-monitor', { cwd: __dirname });
    res.send('ok');
  });

  router.get('/vscode/open-url', async (req, res) => {
    const url = req.query.url?.toString();
    if (url) open(url);
    res.send('ok');
  });
  router.get('/vscode/get-services-from-file', async (req, res) => {
    try {
      if (!req.query.file) return res.status(400).send('file params is required');
      const packageRoot = ws.findPackageRoot(req.query.file?.toString());
      let projectRoot;
      try { projectRoot = ws.findProjectRoot(req.query.file?.toString()); } catch (error) { projectRoot = packageRoot; }
      if (!packageRoot) return res.status(400).send('no package found');
      if (!projectRoot) return res.status(400).send('no package found');
      const monorepo = packageRoot !== projectRoot;
      if (monorepo) {
        const packageInfos = await ws.getPackageInfosAsync(projectRoot);
        const { dependents: dependentsMap } = ws.createDependencyMap(packageInfos);
        const packageJSON = await fse.readJSON(pathfs.resolve(packageRoot, './package.json'));
        const dependents = [
          ...(dependentsMap.get(packageJSON.name) || []),
        ];
        const services = stackMonitor.getServices().filter((service) => {
          const servicePackageNames = [
            service.rootPath,
            service.spawnOptions.cwd,
            ...service.commands.map((cmd) => cmd.spawnOptions?.env),
          ]
            .flat(100)
            .filter((a, i, arr) => (
              a
              && !arr.slice(0, i).includes(a)
              && a.toString() !== projectRoot
              && fs.existsSync(pathfs.resolve(a.toString(), './package.json'))
            ))
            .map((path) => fse.readJSONSync(pathfs.resolve(path?.toString() || '', './package.json')).name);
          return dependents.some((packageName) => servicePackageNames.includes(packageName))
            || servicePackageNames.includes(packageJSON.name);
        });
        res.json(services);
      } else {
        const packageRoot = ws.findPackageRoot(req.query.file?.toString());
        let projectRoot;
        try {
          projectRoot = ws.findProjectRoot(req.query.file?.toString());
        } catch (error) { projectRoot = packageRoot; }
        if (!packageRoot) return res.status(400).send('no package found');
        if (!projectRoot) return res.status(400).send('no package found');
        const services = stackMonitor.getServices().filter((service) => {
          const servicePaths = [
            service.rootPath,
            service.spawnOptions.cwd,
            ...service.commands.map((cmd) => cmd.spawnOptions?.env),
          ]
            .flat(100)
            .filter((a, i, arr) => (
              a
              && !arr.slice(0, i).includes(a)
              && fs.existsSync(pathfs.resolve(a.toString(), './package.json'))
            ));
          return servicePaths.includes(projectRoot);
        });
        res.json(services);
      }
    } catch (error) {
      console.error(error);
      res.json([]);
    }
    return null;
  });
  return router;
};

module.exports = routes;
