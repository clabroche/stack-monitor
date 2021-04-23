const commandExists = require('command-exists')
const {execAsync} = require('./server/helpers/exec')

;(async () => {
  if(commandExists('electron-builder')) {
    await execAsync('electron-builder install-app-deps')
  }
})()