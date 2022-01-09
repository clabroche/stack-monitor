const express = require('express');
const router = express.Router();
const fse = require('fs-extra')
const pathfs = require('path')
const plugins = require('../helpers/plugins')

plugins.routes.forEach(route => router.use(route));

router.use('/plugins', require('./plugins'))
router.use('/system', require('./system'))
router.use('/stack', require('./stack'))
router.use('/fs', require('./fs'))



router.get('/version', async function (req, res) {
  res.send(require('../../package.json').version)
})
module.exports = router;

