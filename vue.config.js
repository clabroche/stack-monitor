module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId: "com.electron.stackmonitor",
        extraFiles: [
          {
            from: "./server",
            to: "./resources/app.asar.unpacked/server",
          }, {
            from: "./node_modules",
            to: "./resources/app.asar.unpacked/server/node_modules",
          },
          {
            from: "./.env.production",
            to: "./resources/app.asar.unpacked/.env.production",
          },
          {
            from: "./package-lock.json",
            to: "./resources/app.asar.unpacked/package.json",
          },
        ],
        productName: "Stack Monitor",
        mac: {
          category: "your.app.category.type",
        },
        snap: {
          publish: ['github']
        },
        linux: {
          icon: "./electron/512x512.png",
          executableName: "StackMonitor",
          artifactName: "${productName}-${version}.${ext}",
          category: "Utility",
        },
        win: {
          icon: "./electron/512x512.png",
        },
      },
    },
  },
};
