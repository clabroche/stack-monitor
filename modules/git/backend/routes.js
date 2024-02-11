const express = require('express');

const router = express.Router();

/** @param {import('@clabroche/fronts-app/typings/export').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  const { git } = stackMonitor;
  router.get('/git/:service/graph', async (req, res) => {
    const graph = await git.getGraph(req.params.service, { graphOnAll: req.query.graphOnAll === 'true' });
    res.json(graph);
  });
  router.get('/git/:service/branches', async (req, res) => {
    const branches = await git.getBranches(req.params.service);
    res.json(branches);
  });
  router.get('/git/:service/status', async (req, res) => {
    const status = await git.getStatus(req.params.service);
    res.json(status);
  });
  router.get('/git/:service/diff', async (req, res) => {
    const diff = await git.getDiff(req.params.service);
    res.json(diff);
  });
  router.post('/git/:service/branch/:branchName/change', async (req, res) => {
    await git.changeBranch(req.params.service, req.params.branchName)
      .then((result) => res.json(result));
  });
  router.delete('/git/:service/branch/:branchName', async (req, res) => {
    await git.deleteBranch(req.params.service, req.params.branchName)
      .then((result) => res.json(result));
  });

  router.get('/git/:service/branch/:branchName/remote-delta', async (req, res) => {
    await git.remoteDelta(req.params.service, req.params.branchName)
      .then((result) => res.json(result));
  });

  router.post('/git/:service/fetch', async (req, res) => {
    await git.fetch(req.params.service)
      .then((result) => res.json(result));
  });

  router.delete('/git/:service/reset', async (req, res) => {
    await git.reset(req.params.service)
      .then((result) => res.json(result));
  });

  router.get('/git/:service/current-branch', async (req, res) => {
    const currentBranch = await git.getCurrentBranch(req.params.service);
    res.json(currentBranch);
  });

  router.post('/git/:service/add-branch', async (req, res) => {
    const currentBranch = await git.addBranch(req.params.service, req.body.name, !!req.body.shouldPush);
    res.json(currentBranch);
  });
  router.post('/git/:service/pull', async (req, res) => {
    await git.pull(req.params.service)
      .then((result) => res.json(result));
  });
  router.post('/git/:service/stash', async (req, res) => {
    await git.stash(req.params.service)
      .then((result) => res.json(result));
  });
  router.post('/git/:service/stash-pop', async (req, res) => {
    await git.stashPop(req.params.service)
      .then((result) => res.json(result));
  });
  router.post('/git/:service/stash-list', async (req, res) => {
    await git.stashList(req.params.service)
      .then((result) => res.json(result));
  });
  router.delete('/git/:service/checkout/:file', async (req, res) => {
    await git.checkoutFile(req.params.service, req.params.file.trim())
      .then((result) => res.json(result));
  });

  return router;
};
