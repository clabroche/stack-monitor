const express = require('express');
const router = express.Router();
const fse = require('fs-extra')
const pathfs = require('path')
const Octokit = require('octokit');

// ============== Load Conf 
const homedir = require('os').homedir();
const confDir = pathfs.resolve(homedir, '.stack-monitor')
if (!fse.existsSync(confDir)) fse.mkdirSync(confDir)
const githubConfigPath = pathfs.resolve(confDir, 'github.json')
if (!fse.existsSync(githubConfigPath)) fse.writeJSONSync(githubConfigPath, {})
const githubconf = fse.readJsonSync(githubConfigPath)

/** @type {Octokit.Octokit | null} */
let octokit = githubconf.GH_TOKEN
  ? new Octokit.Octokit({ auth: githubconf.GH_TOKEN })
  : null



/** @param {import('../../typings/export').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  const { findService } = stackMonitor

  router.get('/github/service/:label/ready', async (req, res) => {
    requirements()
    if (!octokit) return
    const { data: { login } } = await octokit.rest.users.getAuthenticated();
    return res.send(login)
  })

  router.post('/github/service/:label/apikey', async (req, res) => {
    const apikey = req.body.apikey
    if (!apikey) return res.status(400).send('apikey not found in body')
    const _octokit = new Octokit.Octokit({ auth: apikey });
    const { data: { login } } = await _octokit.rest.users.getAuthenticated();
    octokit = _octokit
    githubconf.GH_TOKEN = apikey
    save()
    return res.send(login)
  })

  router.get('/github/service/:label/whoami', async (req, res) => {
    requirements()
    if(!octokit) return
    const { data: { login } } = await octokit.rest.users.getAuthenticated();
    res.json({ loggedAs: login })
  })

  router.get('/github/service/:label/pull-requests', async (req, res) => {
    const service = findService(req.params.label)
    if (!service) return res.status(404).send('Service not found')
    const [owner, repo] = `${new URL(service.git.home).pathname.replace('.git', '')}`.split('/').slice(-2);
    requirements()
    if(!octokit) return
    const { data } = await octokit.rest.pulls.list({owner,repo});
    res.json(data)
  })

  return router
};

function requirements() {
  if (!octokit && !githubconf.GH_TOKEN) {
    throw new Error('github api is not initialized')
  } else if (!octokit) {
    octokit = new Octokit.Octokit({ auth: githubconf.GH_TOKEN });
  }
}

function save() {
  fse.writeJsonSync(githubConfigPath, githubconf)
}