module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        "appId": "com.electron.stackmonitor",
        "extraFiles": [
          {
            "from": "./server",
            "to": "./resources/app.asar.unpacked/server"
          },
          {
            "from": "./.env.production",
            "to": "./resources/app.asar.unpacked/.env.production"
          },
          {
            "from": "./package-lock.json",
            "to": "./resources/app.asar.unpacked/package.json"
          }
        ],
        "productName": "Stack Monitor",
        "mac": {
          "category": "your.app.category.type"
        },
        "linux": {
          "icon": "./electron/512x512.png",
            "executableName": "StackMonitor",
              "artifactName": "${productName}-${version}.${ext}",
                "category": "Utility"
        },
        "win": {
          "icon": "./electron/512x512.png"
        }
      }
    }
  }
}