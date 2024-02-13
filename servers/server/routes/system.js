const { express } = require('@clabroche/common-express');

const router = express.Router();
const pidusageTree = require('pidusage-tree');
const os = require('os');
const Stack = require('../models/stack');

router.get('/:service/infos', async (req, res) => {
  try {
    const service = Stack.findService(req.params.service);
    const pid = service.pids[0]?.pid;
    res.json(pid ? await getCPU(pid) : {
      cpu: null,
      ram: null,
    });
  } catch (e) {
    res.json({ cpu: null, mem: null });
  }
});

router.get('/disconnect', async () => {
  process.exit(0);
});

/** @param {number} pid */
async function getCPU(pid) {
  const tree = await pidusageTree(pid).catch(() => null);
  /** @type {number[]} */
  const cpus = [];
  let mem = 0;
  let cpuPerc = 0;
  let totalMem = 0;
  if (tree) {
    Object.keys(tree).forEach((key) => {
      if (tree[key]?.cpu) cpus.push(tree[key].cpu);
      if (tree[key]?.memory) mem += tree[key].memory;
    });
    cpuPerc = cpus.reduce((prev, curr) => prev + curr, 0) / cpus.length;
    totalMem = os.totalmem();
  }
  return {
    cpu: Number.isNaN(cpuPerc) ? 0 : cpuPerc,
    mem: mem / totalMem,
  };
}

module.exports = router;
