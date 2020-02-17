const express = require('express');
const router = express.Router();
require('colors')

router.use('/system', require('./system'))
router.use('/stack', require('./stack'))
router.use('/git', require('./git'))

module.exports = router;

