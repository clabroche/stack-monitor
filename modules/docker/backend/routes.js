const express = require('express');
const { execAsync } = require('../../../servers/server/helpers/exec');

const router = express.Router();

/** @param {import('@clabroche/common-typings').StackMonitor} stackMonitor */
module.exports = (stackMonitor) => {
  router.get('/docker/:service', async (req, res) => {
    const service = stackMonitor.findService(req.params.service);
    if (!service) return res.status(404).send('Service not found');
    const isAlive = await execAsync(`docker inspect --format {{.State.Pid}} ${service.container.name}`, {})
      .catch(() => null);
    const dockerInfos = await execAsync(`docker inspect ${service.container.name}`, {})
      .then((data) => {
        try {
          return JSON.parse(data)[0];
        } catch (error) {
          console.error(error);
          return '';
        }
      })
      .catch(() => null);
    let dockerImage = null;
    if (dockerInfos) {
      console.log(dockerInfos.Image);
      dockerImage = await execAsync(`docker history --no-trunc --human --format json ${dockerInfos.Image}`, {})
        .then((data) => {
          try {
            return data.trim().split('\n').map((a) => JSON.parse(a)).sort((a, b) => {
              if (a && b) return a.CreatedAt.localeCompare(b.CreatedAt);
              return 0;
            })
              .map((a) => `${a.Size} ${a.CreatedBy}    `);
          } catch (error) {
            console.error(error);
            return '';
          }
        })
        .catch(() => null);
    }
    res.json([
      { label: 'containerName', value: service.container.name },
      { label: 'isAlive', value: !!isAlive },
      { label: 'pid', value: isAlive },
      { label: 'dockerInfos', value: dockerInfos, type: 'json' },
      { label: 'image', value: dockerImage, type: 'json' },
    ]);
    return null;
  });
  return router;
};
