---
outline: deep
---
# Service options
These options can be taken into account in several places. 
The easiest way is to export them directly into your configuration file

```js [js]
module.exports = [
  {
    // Service Options...
  },
  {
    // Service Options...
  },
  //....
]
```
But you can also use other formats for your configuration file

 - [Global Options](/reference/global-options)
 - [Extended](/reference/extended-options)

## Label

type: string,required: true

Define your service name. It acts like an ID in internal.
```js [js]
module.exports = [{
  //...
  label: "...",
}]
```

## Description

type: string,required: false

Define your service description.
```js [js]
module.exports = [{
  //...
  description: "...",
}]
```

## Root path

type: string,required: false

Define your service root directory.
```js [js]
module.exports = [{
  //...
  rootPath: "...",
}]
```

## Groups

type: string[],required: false

Define to which group the service belongs.
```js [js]
module.exports = [{
  //...
  groups: ["...", "..."],
}]
```

## Documentation

type: string[],required: false

Define the path where to find the markdown files for the service documentation.
```js [js]
module.exports = [{
  //...
  "documentation": pathfs.resolve('<path-to-service>', 'docs'),
}]
```

## Git

type: Object,required: false

Define informations for git.
```js [js]
module.exports = [{
  //...
  "git": {
    //... Git options
  },
}]
```
### Home

type: string,required: false

Define home page for git.
```js [js]
module.exports = [{
  //...
  "git": {
    //...
    home: 'https://<an-awesome-url>'
  },
}]
```

### Remote

type: string,required: false

Define git remote for git.
```js [js]
module.exports = [{
  //...
  "git": {
    //...
    remote: 'git@github.com:<your-beautiful-profile>/<your-excellent-project>.git'
  },
}]
```

## Url

type: string,required: false

Add an url in stack monitor.
```js [js]
module.exports = [{
  //...
  "url": "https://<an-awesome-url-to-my-service>"
}]
```

## Urls

type: string[],required: false

Add multiple urls in stack monitor.
```js [js]
module.exports = [{
  //...
  "urls": ["https://<an-awesome-url-to-my-service>", '...']
}]
```

## Commands
type: Command[],required: false

Define how service should be launched

```js [js]
module.exports = [{
  //...
  "commands": [
    {
      //... Commands options
    }
  ]
}]
```

### SpawnCmd
type: string,required: false

Define which command to launch

```js [js]
module.exports = [{
  //...
  "commands": [
    {
      spawnCmd: 'node',
      //..
    }
  ]
}]
```

### SpawnArgs
type: string[],required: false

Define which command to launch and his arguments

```js [js]
module.exports = [{
  //...
  "commands": [
    {
      spawnCmd: 'node',
      spawnArgs: ['run', 'serve'],
      //..
    }
  ]
}]
```

### SpawnOptions
type: ProcessOptions[],required: false

Define different options to pass to process

[Complete nodejs definition](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options) (see options)

```js [js]
module.exports = [{
  //...
  "commands": [
    {
      spawnCmd: 'node',
      spawnOptions: {
        cwd: pathfs.resolve(path, 'front'), // current work dir for process
        env: {// All Envs
          UI_PORT: env?.UI_PORT,
          VITE_APP_API_URL: env?.SERVER_URL
        }
      }
    }
  ]
}]
```


## Health check

You can configure a health check. If a health check fails, the associated service will be highlighted in red in the interface.

::: code-group
```js [./stack.js]
// Useful to reuse your health check in other services
const healthCheck = require('./healthCheck')
// Used to blacklist logs from the healthcheck endpoint
const hideHealthCheckParser = require('./parsers/healthCheck')
module.exports = [{
  //...
  health: healthCheck('/v1/my-service/health'),
  logParsers: [hideHealthCheckParser('/v1/my-service/health')],
}]
```
```js [./healthCheck.js]
const axios = require('axios').default;

/** @param {string} path */
module.exports = (path) => ({
  /** @param {import('@iryu54/stack-monitor').Service} service */
  check: async (service) => {
    if (!service?.url) return true;
    const { data } = await axios.get(service.url + (path || ''));
    return !!data;
  },
  interval: 2000,
});
```
```js [./parsers/healthCheck.js]
/** @param {string} path */
module.exports = (path) => ({
  id: 'health-ignore-parser',
  transform: (msg) => {
    if (msg?.json?.message?.url?.includes(path)) {
      msg.hide = true;
    }
    return msg;
  },
});
```

:::