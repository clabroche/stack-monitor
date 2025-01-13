const { express } = require('@clabroche/common-express');
const config = require('../models/EncryptionKey');
const dbs = require('../helpers/dbs');

const router = express.Router();

router.get('/generate-key', async (req, res) => {
  res.send(await config.generateKey());
});
router.post('/encryption-key', async (req, res) => {
  const { key } = req.body;
  await config.saveKey(key);
  return res.send(key);
});
router.get('/should-setup', async (req, res) => {
  if (!config.encryptionKey) return res.json(true);
  const envSample = (await dbs.getDbs('envs'))[0];
  try {
    if (envSample) await dbs.getDb(`envs/${envSample}`).read();
    return res.json(false);
  } catch (error) {
    console.error(error);
    return res.json(true);
  }
});
router.get('/encryption-key', async (req, res) => {
  res.send(config.encryptionKey);
});
router.post('/test-encryption-key', async (req, res) => {
  const result = await config.testKey(req.body?.key || config.encryptionKey);
  if (result) return res.send('ok');
  return res.status(400).send(config.encryptionKey);
});

module.exports = router;
