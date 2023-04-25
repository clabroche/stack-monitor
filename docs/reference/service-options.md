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
{
  //...
  label: "...",
}
```

## Description

type: string,required: false

Define your service description.
```js [js]
{
  //...
  description: "...",
}
```

## Root path

type: string,required: false

Define your service root directory.
```js [js]
{
  //...
  rootPath: "...",
}
```

## Groups

type: string[],required: false

Define to which group the service belongs.
```js [js]
{
  //...
  groups: ["...", "..."],
}
```

## Documentation

type: string[],required: false

Define the path where to find the markdown files for the service documentation.
```js [js]
{
  //...
  "documentation": pathfs.resolve('<path-to-service>', 'docs'),
}
```

## Git

type: Object,required: false

Define informations for git.
```js [js]
{
  //...
  "git": {
    //... Git options
  },
}
```
### Home

type: string,required: false

Define home page for git.
```js [js]
{
  //...
  "git": {
    //...
    home: 'https://<an-awesome-url>'
  },
}
```

### Remote

type: string,required: false

Define git remote for git.
```js [js]
{
  //...
  "git": {
    //...
    remote: 'git@github.com:<your-beautiful-profile>/<your-excellent-project>.git'
  },
}
```

## Url

type: string,required: false

Add an url in stack monitor.
```js [js]
{
  //...
  "url": "https://<an-awesome-url-to-my-service>"
}
```

## Urls

type: string[],required: false

Add multiple urls in stack monitor.
```js [js]
{
  //...
  "urls": ["https://<an-awesome-url-to-my-service>", '...']
}
```

## Commands
type: Command[],required: false

Define how service should be launched

```js [js]
{
  //...
  "commands": [
    {
      //... Commands options
    }
  ]
}
```

### SpawnCmd
type: string,required: false

Define which command to launch

```js [js]
{
  //...
  "commands": [
    {
      spawnCmd: 'node',
      //..
    }
  ]
}
```

### SpawnArgs
type: string[],required: false

Define which command to launch and his arguments

```js [js]
{
  //...
  "commands": [
    {
      spawnCmd: 'node',
      spawnArgs: ['run', 'serve'],
      //..
    }
  ]
}
```

### SpawnOptions
type: ProcessOptions[],required: false

Define different options to pass to process

[Complete nodejs definition](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options) (see options)

```js [js]
{
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
}
```
