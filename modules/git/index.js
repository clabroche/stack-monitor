const express = require('express');
const router = express.Router();
const commandExists = require('command-exists')



module.exports = {
  name: 'Git',
  icon: 'fab fa-git-alt',
  placements: ['service', {
    position: "sidebar",
    label: "GIT",
    icon: "fab fa-git-alt",
    goTo: { path: "/Git-NotUpToDate" },
    active: "Git-NotUpToDate",
  }],
  order: 1,
  hidden: () => commandExists('git').then(() => false).catch(() => true),
  routes: router.use('/git', require('./routes')),
}