const express = require('express');
const { Octokit } = require('fix-esm').require('@octokit/core');
const { restEndpointMethods } = require('fix-esm').require('@octokit/plugin-rest-endpoint-methods');

const router = express.Router();

const MyOctokit = Octokit.plugin(restEndpointMethods);

/** @type {Octokit & import('@octokit/plugin-rest-endpoint-methods').Api | null} */
let octokit = process.env.STACK_MONITOR_GH_APIKEY
  ? new MyOctokit({ auth: process.env.STACK_MONITOR_GH_APIKEY })
  : null;

/** @param {import('@clabroche/common-typings').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  const { findService } = stackMonitor;

  router.get('/github/service/:label/ready', async (req, res) => {
    requirements();
    if (!octokit) return null;
    const { data: { login } } = await octokit.rest.users.getAuthenticated();
    return res.send(login);
  });

  router.post('/github/service/:label/apikey', async (req, res) => {
    const { apikey } = req.body;
    if (!apikey) return res.status(400).send('apikey not found in body');
    const _octokit = new Octokit.Octokit({ auth: apikey });
    const { data: { login } } = await _octokit.rest.users.getAuthenticated();
    octokit = _octokit;
    return res.send(login);
  });

  router.get('/github/service/:label/whoami', async (req, res) => {
    requirements();
    if (!octokit) return;
    const { data: { login } } = await octokit.rest.users.getAuthenticated();
    res.json({ loggedAs: login });
  });

  router.get('/github/service/:label/pull-requests', async (req, res) => {
    const service = findService(req.params.label);
    if (!service) return res.status(404).send('Service not found');
    const [owner, repo] = `${new URL(service.git.home).pathname.replace('.git', '')}`.split('/').slice(-2);
    requirements();
    if (!octokit) return null;
    const { data } = await octokit.rest.pulls.list({ owner, repo });
    return res.json(data);
  });

  return router;
};

function requirements() {
  if (!octokit && !process.env.STACK_MONITOR_GH_APIKEY) {
    throw new Error('github api is not initialized');
  } else if (!octokit) {
    octokit = new MyOctokit({ auth: process.env.STACK_MONITOR_GH_APIKEY });
  }
}
