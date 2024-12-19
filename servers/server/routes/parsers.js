const { express } = require('@clabroche/common-express');
const Parser = require('../models/Parser');

const router = express.Router();

router.post('/', async (req, res) => {
  delete req.body.id;
  const parser = new Parser(req.body);
  await parser.save();
  res.json(parser.toStorage());
});
router.put('/:id', async (req, res) => {
  const parser = await Parser.find(req.params.id);
  if (!parser) return res.status(404).send('Parser not found');
  await parser.update(req.body);
  res.json(parser.toStorage());
});
router.delete('/:id', async (req, res) => {
  const parser = await Parser.find(req.params.id);
  if (!parser) return res.status(404).send('Parser not found');
  await parser?.delete();
  res.json('ok');
});

router.get('/', async (req, res) => {
  const parsers = await Parser.all();
  res.json(parsers);
});

module.exports = router;
