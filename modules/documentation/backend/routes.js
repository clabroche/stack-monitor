const express = require('express');
const Leaf = require('./Leaf');
const PromiseB = require('bluebird')

const router = express.Router();

/** @param {import('@clabroche/common-typings').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  const { findService } = stackMonitor;

  router.get('/documentation/tree', async (req, res) => {
    const service = findService(req.query.serviceId?.toString() || '');
    const result = await Leaf.getTree(service?.label)
    return res.send(result);
  });
  router.post('/documentation/tree/sort', async (req, res) => {
    const leafs = await PromiseB.mapSeries(req.body, async (_leaf, index) => {
      const leaf = await Leaf.find({ id: _leaf.id})
      if(!leaf) return
      leaf.position = index
      await leaf.save()
      return leaf
    })
    return res.send(leafs);
  });
  router.post('/documentation/tree', async (req, res) => {
    const result = await new Leaf({
      ...req.body,
    }).save()
    return res.send(result);
  });
  router.post('/documentation/tree/:key', async (req, res) => {
    const result = await new Leaf({
      ...req.body,
      id: req.params.key,
    }).save()
    return res.send(result);
  });

  router.delete('/documentation/tree/:key', async (req, res) => {
    const result = await Leaf.find({
      id: req.params.key,
    })
    if (result) return res.send(await result.remove())
    return res.send();
  });
  return router;
};
