const express = require("express");
const router = express.Router();

/** @param {import('../../fronts/app/typings/export').StackMonitor} Stack */
module.exports = (Stack) => {
  const {globalScripts} = Stack
  router.get("/global-scripts/", async (req, res) => {
    res.json(globalScripts.getScripts());
  });

  router.get("/global-scripts/:id", async (req, res) => {
    const script = await globalScripts.getScript(req.params.id)
    res.json(script)
  });
  
  router.post("/global-scripts/:id", async (req, res) => {
    const communicationId = await globalScripts.launchScript(req.params.id)
    res.json(communicationId);
  });
  return router
}
