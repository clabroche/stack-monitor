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