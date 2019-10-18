var express = require('express');
var router = express.Router();
const Stack = require('../models/stack')
const Socket = require('../models/socket')
const {exec } = require('child_process')
const osutils = require('os-utils');
const pidusageTree = require('pidusage-tree')
const os = require('os')
const SpawnStore = {}
require('colors')
/* GET home page. */
router.get('/stack/configuration', function(req, res, next) {
  res.json(Stack.stackConfig)
});
router.post('/stack/choose', function(req, res, next) {
  Stack.stack = req.body
  launch()
  res.json(Stack.stack)
});
router.get('/stack', function(req, res, next) {
  res.json(Stack.stack)
});

router.get('/stack/:service/logs', function(req, res, next) {
  const service = findService(req.params.service)
  res.send(service ? service.store : '')
});
router.delete('/stack/:service/logs', function(req, res, next) {
  const service = findService(req.params.service)
  console.log(req.params.service)
  service.store = ''
  res.send(service ? service.store : '')
});
router.get('/stack/:service/open-in-vs-code', function(req, res, next) {
  const service = findService(req.params.service)
  exec('code .', {cwd: service.spawnOptions.cwd})
  res.send()
});
router.get('/stack/:service/restart', async function(req, res, next) {
  const service = findService(req.params.service)
  const pid = SpawnStore[service.label].pid
  SpawnStore[service.label].kill('SIGQUIT')
  SpawnStore[service.label].kill('SIGTERM')
  SpawnStore[service.label].kill('SIGINT')
  SpawnStore[service.label].kill('SIGKILL')
  // exec('kill -9 ' + pid)
  // console.log(await netstat(pid))
  // console.log('kill -9 ' + pid, service.pid)
  await new Promise(resolve => setTimeout(resolve, 100))
  launchService(service)
  res.send()
});

router.get('/system/infos', async function(req, res, next) {
  
})
router.get('/git/:service/branches', async function(req, res, next) {
  const service = findService(req.params.service)
  res.json(await getBranches(service))
})
router.get('/git/:service/status', async function(req, res, next) {
  const service = findService(req.params.service)
  res.json(await getStatus(service))
})
const nbCpus= os.cpus().length
let cpuUsage = 0
setInterval(() => {
  osutils.cpuUsage(function(v){
    cpuUsage = v
  })
}, 1100);
router.get('/system/global-infos', async function(req, res, next) {
  const ram = await getRam()
  try {
    res.json({
      nbCpus,
      memPercentage: ram.memPercentage,
      totalmem: ram.totalmem,
      freemem: ram.freemem,
      cpu: cpuUsage
    })
  } catch (e) {
    res.json({cpu: null, mem: null, memPercentage:null, freemem:null, totalmem:null})
  }
})
router.get('/system/:service/infos', async function(req, res, next) {
  try {
    const service = findService(req.params.service)
    res.json(await getCPU(SpawnStore[service.label].pid))
  } catch (e) {
    res.json({cpu: null, mem: null})
  }
})
router.get('/system/disconnect', async function(req, res, next) {
  process.exit(0)
})

async function getRam() {
  const line = await new Promise((resolve, reject) => {
    exec('free -t --mega | grep Total', (err, stdout) => resolve(stdout))
  });
  const regex = /\d+/gm;
  let m;
  let res = [];

  while ((m = regex.exec(line)) !== null) {
      if (m.index === regex.lastIndex) regex.lastIndex++;
      m.forEach(match => res.push(match));
  }
  return {
    memPercentage: res[1] * 100 / res[0],
    totalmem: res[0],
    freemem: res[5],
  }
}
async function getCPU(pid) {
  const tree = await pidusageTree(pid).catch(err => {
    return null
  })
  let cpus = []
  let mem = 0
  let cpuPerc = 0
  let totalMem = 0
  if(tree) {
    Object.keys(tree).map(key => {
      if(tree && tree[key] && tree[key].cpu) cpus.push(tree[key].cpu)
      if(tree && tree[key] && tree[key].memory) mem += tree[key].memory
    })
    cpuPerc = cpus.reduce((prev, curr) => {
      return prev  + curr
    }, 0) / cpus.length
    totalMem = os.totalmem()
  } 
  return {
    cpu: Number.isNaN(cpuPerc / 10) ? 0 : cpuPerc / 10,
    mem: mem / totalMem
  }
}

function getBranches(project) {
  if(!project) return []
  return new Promise((resolve, reject) => {
    exec('git branch', {
      cwd: project.spawnOptions.cwd
    }, (err, stdout, stderr) => {
      resolve(stdout.toString().trim().split('\n'))
    })
  });
}

function getStatus(project) {
  return new Promise((resolve, reject) => {
    if(!project) return resolve([])
    exec('git status -s', {
      cwd: project.spawnOptions.cwd
    }, (err, stdout, stderr) => {
      resolve(stdout.toString().trim().split('\n'))
    })
  });
}

function findService(serviceLabel) {
  return Stack.stack.filter(s => s.label === serviceLabel)[0]
}

module.exports = router;
const {spawn} = require('child_process')
function launch() {
  Stack.stack.map((microservice, i) => {
    microservice.store = ''
    launchService(microservice)
  })
}

function netstat(pid) {
  return new Promise((resolve, reject) => {
    exec('netstat -tulpn | grep ' + pid, (err, stdout) => {
      resolve(stdout)
    })
  });
}
function launchService(microservice) {
  microservice.spawnOptions = microservice.spawnOptions || {}
  microservice.spawnOptions.shell = true
  // microservice.spawnOptions.stdio = 'inherit'
  SpawnStore[microservice.label] = spawn(microservice.spawnCmd, microservice.spawnArgs || [], microservice.spawnOptions)
  SpawnStore[microservice.label].title = microservice.label
  microservice.pid = SpawnStore[microservice.label].pid
  SpawnStore[microservice.label].stdout.on('data', data => {
    const line = data.toString()
    microservice.store += line
    Socket.socket.emit('logs:update', {msg: line, label: microservice.label})
  })
  SpawnStore[microservice.label].stderr.on('data', data => {
    const line = data.toString().red
    microservice.store += line
    Socket.socket.emit('logs:update', {msg: line, label: microservice.label})
  })
}