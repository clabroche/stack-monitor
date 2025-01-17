const { express } = require('@clabroche/common-express');

const router = express.Router();
const plugins = require('../helpers/plugins');

plugins.routes.forEach((route) => router.use(route));

router.use('/plugins', require('./plugins'));
router.use('/system', require('./system'));
router.use('/stack', require('./stack'));
router.use('/fs', require('./fs'));
router.use('/crypto', require('./crypto'));
router.use('/parsers', require('./parsers'));
router.use('/editors', require('./editors'));

router.get('/version', async (req, res) => {
  res.send(require('../helpers/version').version);
});

module.exports = router;
