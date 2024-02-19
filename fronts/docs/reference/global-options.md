---
outline: deep
---

# Global Options

You should use this format to take global options in account

```js [js]
module.exports = {
  //... Global Options
  services: [] // Services Options...
}
```
To view services options go to [Service Options](/reference/service-options)

## WatchFiles
type: string[],required: false

List of all files that the application will listen for changes. You can put your environment variable files for example.

If there is a change in these files the application will try to restart the services concerned or update the internal configuration

```js [js]
module.exports = {
  //...
  watchFiles: [
    require.resolve('./env.local'),
    require.resolve('./env.preprod'),
    //...
  ],
}
```
## Log Parsers
type: string[],required: false

Capture log messages and create custom parser. There is some built-in parsers.

```js [js]

/** @type {import('@iryu54/stack-monitor').Parser} */
const yourCustomParser = {
  id: 'my-awesome-parser',
  transform: (line) => {
    if (line?.json?.level === 'error') { // line.json is filled by previous 'stackMonitor.parsers.jsons'
      line.source = 'stderr'; // We want to pass this line to the stderr channel. A red border will be applied in view
    }
    return line;
  },
};

module.exports = (stackMonitor) => {
  return {
    //...
    logParsers: [
      stackMonitor.parsers.links,
      stackMonitor.parsers.jsons,
      stackMonitor.parsers.debug,
      yourCustomParser,
    ],
  }
}
```

A custom parser should be of this shape:

```js [js]
/**
 * @typedef {{
 *  msg: string,
 *  raw: string,
 *  timestamp: number,
 *  id: string,
 *  source?: 'stdout' | 'stderr'
 *  json?: Record<any, any> | any[] | null,
 *  debug?: Record<any, any> | any[] | null,
 *  isSeparator?: boolean,
 *  label: string,
 *  pid?: number,
 *  cmd?: {
 *    cmd: string,
 *    args: string[],
 *    options: import('child_process').ExecOptions
 *   },
 * }} LogMessage
 */

/**
 * @typedef {{
 *  id: string,
 *  transform: ((msg: LogMessage, service?: Service | null) => LogMessage)
 * }} Parser
 */
```

You could helped by types in 
```js [js]
import('@iryu54/stack-monitor').Parser
```


## documentation
type: string,required: false

Path to your documentation files. Place all your md files in it and it will appear on the home page

```js [js]
const pathfs = require('path')

module.exports = (stackMonitor) => {
  return {
    //...
    documentation: pathfs.resolve(__dirname, './documentations/my-service')
  }
}
```
