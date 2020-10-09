const express = require('express');
const router = express.Router();
require('colors')

router.use('/system', require('./system'))
router.use('/stack', require('./stack'))
router.use('/git', require('./git'))
router.use('/npm', require('./npm'))


router.get('/version', async function (req, res) {
  res.send(require('../../package.json').version)
})
module.exports = router;

