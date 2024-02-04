---
outline: deep
---
# Getting Started

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) version 16 or higher.
- Terminal for launching Stack Monitor (CLI).
- Git to enable git capabilities.

To install in a git project:
::: code-group
```sh [npm]
$ npm install -D @iryu54/stack-monitor
```

```sh [pnpm]
$ pnpm add -D @iryu54/stack-monitor
```

```sh [yarn]
$ yarn add -D @iryu54/stack-monitor
```
:::

To install in global:
::: code-group

```sh [npm]
$ npm install -g @iryu54/stack-monitor
```

```sh [yarn]
$ yarn global add @iryu54/stack-monitor
```
:::


### Launch

In project installation, you can launch it by adding a script to your package.json:

```json [json]
{
  "name": "...",
  "version": "...",
  "description": "...",
  "main": "src/stack.js",
  "license": "...",
  "author": "...",
  "scripts": {
    "serve": "cross-env HTTP_PORT=6872 stack-monitor ./src/stack.js"
  }
}
```



Stack Monitor ships with a command line. After global installation, start it by running:

```sh [bash]
$ stack-monitor <config-file>
```

### The Config File

The config file should be a javascript file. Three syntax are possible from easy to more flexible.

```js
// env.js
module.exports.SERVER_PORT='3009'
module.exports.UI_PORT='5178'
module.exports.mongoDbURL=`mongodb://root:123456@localhost:27017/my-base?authSource=admin`
module.exports.SERVER_URL=`http://localhost:${module.exports.SERVER_PORT}`
```

#### Easy way

For all options, see [Config Reference](/reference/service-options).

```js
// Stack.js
const pathfs =require('path')
const env =require('./env.js')

//Just export config for services
module.exports = [
  {
    label: 'Server',
    root: pathfs.resolve('<path-to-service>', 'server'),
    commands: [{
      spawnCmd: 'npm',
      spawnArgs: ['run', 'serve'],
      spawnOptions: {
        cwd: pathfs.resolve('<path-to-service>', 'server'),
        env: {
          PORT: env?.SERVER_PORT,
          mongoDbURL: env?.mongoDbURL,
        }
      }
    }]
  },
  {
    label: 'Front',
    root: pathfs.resolve('<path-to-service>', 'front'),
    commands: [{
      spawnCmd: 'npm',
      spawnArgs: ['run', 'serve'],
      spawnOptions: {
        cwd: pathfs.resolve('<path-to-service>', 'front'),
        env: {
          UI_PORT: env?.UI_PORT,
          VITE_APP_API_URL: env?.SERVER_URL
        }
      }
    }]
    
  },
]
```


#### Medium way

```js
// Stack.js
const pathfs =require('path')
const env =require('./env.js')

module.exports = {
  //... More Options to configure stack monitor
  services: [
  {
    label: 'Server',
    root: pathfs.resolve('<path-to-service>', 'server'),
    commands: [{
      spawnCmd: 'npm',
      spawnArgs: ['run', 'serve'],
      spawnOptions: {
        cwd: pathfs.resolve('<path-to-service>', 'server'),
        env: {
          PORT: env?.SERVER_PORT,
          mongoDbURL: env?.mongoDbURL,
        }
      }
    }]
  },
  {
    label: 'Front',
    root: pathfs.resolve('<path-to-service>', 'front'),
    commands: [{
      spawnCmd: 'npm',
      spawnArgs: ['run', 'serve'],
      spawnOptions: {
        cwd: pathfs.resolve('<path-to-service>', 'front'),
        env: {
          UI_PORT: env?.UI_PORT,
          VITE_APP_API_URL: env?.SERVER_URL
        }
      }
    }]
    
  },
]
}
```

#### Flexible way

```js
// Stack.js
const pathfs =require('path')
const env =require('./env.js')

/** @type {import('../server/models/stack.js').StackFile} */
const stack = (stackMonitor) => {
  // Interact and extends capability of stack monitor
  return {
    //... More Options to configure stack monitor
    services: [
      {
        label: 'Server',
        root: pathfs.resolve('<path-to-service>', 'server'),
        commands: [{
          spawnCmd: 'npm',
          spawnArgs: ['run', 'serve'],
          spawnOptions: {
            cwd: pathfs.resolve('<path-to-service>', 'server'),
            env: {
              PORT: env?.SERVER_PORT,
              mongoDbURL: env?.mongoDbURL,
            }
          }
        }]
      },
      {
        label: 'Front',
        root: pathfs.resolve('<path-to-service>', 'front'),
        commands: [{
          spawnCmd: 'npm',
          spawnArgs: ['run', 'serve'],
          spawnOptions: {
            cwd: pathfs.resolve('<path-to-service>', 'front'),
            env: {
              UI_PORT: env?.UI_PORT,
              VITE_APP_API_URL: env?.SERVER_URL
            }
          }
        }]
        
      },
    ]
  }
}
module.exports = stack
```

Consult the [Config Reference](/reference/service-options) for full details on all config options.
