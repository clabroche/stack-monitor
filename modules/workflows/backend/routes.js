const { express, getServer } = require('@clabroche/common-express');
const { sockets } = require('@clabroche/common-socket-server');
var RED = require("node-red");
const compressing = require('compressing')

const router = express.Router();
const pathfs = require('path');
const { existsSync } = require('fs');
const { rm, readFile, writeFile, mkdir, readdir } = require('fs/promises');
const ports = require('@clabroche/servers-server/models/ports');
const { execAsync } = require('@clabroche/servers-server/helpers/exec');
const EncryptionKey = require('@clabroche/servers-server/models/EncryptionKey');
const PromiseB = require('bluebird')
const { v4 } = require('uuid');

/** @param {import('@clabroche/common-typings').StackMonitor} Stack */
module.exports = (Stack) => {
  getServer().then(async (server) => {
    const userDir = pathfs.resolve(Stack.getRootPath(), 'nodered')
    if (!existsSync(userDir)) await mkdir(userDir, {recursive: true})
    const settings = {
      httpAdminRoot: "/red",
      httpNodeRoot: "/node-red",
      userDir,
      credentialSecret: EncryptionKey.encryptionKey,
      functionGlobalContext: {},
      flowFile: 'flow.json',
      paletteCategories: ['Stack Monitor'],
    }
    settings.functionGlobalContext.stackmonitor = {
      sockets,
      url: `http://localhost:${ports.http}`,
      stack: require('@clabroche/servers-server/models/stack')
    }
    
    RED.init(server, {
      ...settings,
    });
    router.use(settings.httpAdminRoot, RED.httpAdmin);
    router.use(settings.httpNodeRoot, RED.httpNode);

    const moduleName = 'node-red-contrib-stack-monitor'
    const modulePath = pathfs.resolve(userDir, 'node_modules', moduleName);
    const localNodeModuleTarPath = pathfs.resolve(__dirname, `${moduleName}.tar`)
    const packageJSONPath = pathfs.resolve(userDir, 'package.json')

    if (existsSync(modulePath)) {
      console.log(moduleName, 'found, delete it before start nodered')
      await rm(modulePath, { recursive: true, force: true })
    }

    await PromiseB.map(await readdir(userDir), async file => {
      if(file.startsWith(`node-red-contrib-stack-monitor-`) && file.endsWith('.tgz')) {
        await rm(pathfs.resolve(userDir, file))
      }
    })

    /** @type {Buffer} */
    let buffer
    if(existsSync(localNodeModuleTarPath)) {
      console.log(`Read ${moduleName} from local tar`)
      buffer = await readFile(localNodeModuleTarPath)
    } else {
      console.log(`Build ${moduleName} from dir`)
      function stream2buffer(stream) {
        return new Promise((resolve, reject) => {
          const _buf = [];
          stream.on("data", (chunk) => _buf.push(chunk));
          stream.on("end", () => resolve(Buffer.concat(_buf)));
          stream.on("error", (err) => reject(err));
        });
      }
      const stream = new compressing.tar.Stream()
      stream.addEntry(pathfs.resolve(__dirname, './nodes'), { ignoreBase: true, relativePath: 'package' })
      buffer = await stream2buffer(stream)
    }

    let packageJSON = {
      "name": "node-red-project",
      "description": "A Node-RED Project",
      "version": "0.0.1",
      "private": true,
      "dependencies": {}
    }
    
    if (existsSync(packageJSONPath)) {
      packageJSON = JSON.parse(await readFile(packageJSONPath, 'utf-8'))
    }
    const tgzFileName = `${moduleName}-${v4()}.tgz`
    packageJSON.dependencies[moduleName] = `file:${tgzFileName}`
    const pathToTgz = pathfs.resolve(userDir, `${tgzFileName}`) 
    await writeFile(pathToTgz, buffer)
    await writeFile(packageJSONPath, JSON.stringify(packageJSON, null, 2), 'utf-8')
    await execAsync('npm i', { cwd: userDir })

    await writeFile(pathfs.resolve(userDir, '.gitignore'), `*
!flow.json
!flow_cred.json
!package.json
    `)
    await RED.start();
    sockets.emit('scenarios:start')
  })
  return router;
};
