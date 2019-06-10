# Stack Monitor
![vulnerabilities](./badge-audit.svg)

Monitor processes as a stack

## Install

``` npm i -g @iryu54/stack-monitor ```


## Usage
Create a config file like: 
``` javascript
module.exports = [{
  label: 'My beautiful service',
  spawnCmd: './node_modules/.bin/gulp', // Cmd to execute
  spawnOptions: { // Pass to spawn argument
    cwd:  '<path/to/my/beautiful/service>',
    env: {
      port:"3006",
      mongoDbURL:`mongodb://root:123456@localhost:27017/test?authSource=admin`,
    }
  }
}, {
  label: 'Mongo',
  spawnCmd: 'docker',
  spawnArgs: [ // Args argument of spawn
    'start', 'mongo',
  ],
}]
```

Then, in a terminal:
``` bash
stack-monitor <path/to/my/config>
```

## Examples

This stack is composed of a vue client, an express server and a mongo database

``` javascript 
module.exports = [
  {
    label: 'Server',
    spawnCmd: 'npm',
    spawnArgs: ['run', 'start'],
    spawnOptions: {
      cwd:  '/home/coco/demo-stack/server',
      env: Object.assign({
        PORT:"3006",
        mongoDbURL:`mongodb://root:123456@localhost:27017/test?authSource=admin`,
      }, process.env)
    }
  },
  {
    label: 'Client',
    spawnCmd: 'npm',
    spawnArgs: ['run', 'serve'],
    spawnOptions: {
      cwd:  '/home/coco/demo-stack/client',
      env: process.env
    }
  },

  {
    label: 'Mongo',
    spawnCmd: 'docker',
    spawnArgs: [
      'run', '--rm',
      '-p', '2701:27017',
      '-e', "MONGO_INITDB_ROOT_USERNAME=root",
      '-e', 'MONGO_INITDB_ROOT_PASSWORD=123456',
      '-e', 'MONGO_INITDB_DATABASE=test',
      'mongo:latest'
    ],
  },
]
```
This will show: 
![Menu](https://raw.githubusercontent.com/clabroche/stack-monitor/master/1.png)
![Menu](https://raw.githubusercontent.com/clabroche/stack-monitor/master/2.png)
![Menu](https://raw.githubusercontent.com/clabroche/stack-monitor/master/3.png)
![Menu](https://raw.githubusercontent.com/clabroche/stack-monitor/master/4.png)