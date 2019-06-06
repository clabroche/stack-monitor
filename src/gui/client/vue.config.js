const path = require('path');
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin
const PurgecssPlugin = require('purgecss-webpack-plugin');
const glob = require('glob-all');
module.exports = {
  runtimeCompiler: true,

  configureWebpack: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, 'src/'),
        'vue$': 'vue/dist/vue.esm.js' // 'vue/dist/vue.common.js' for webpack 1
      }
    },
    performance: {
      hints: false
    },
    optimization: {
      splitChunks: {
        minSize: 0,
        maxSize: 250000000,
        chunks: 'all',
        maxInitialRequests: Infinity,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              // get the name. E.g. node_modules/packageName/not/this/part.js
              // or node_modules/packageName
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];

              // npm package names are URL-safe, but some servers don't like @ symbols
              return `npm.${packageName.replace('@', '')}`;
            },
          },
        },
      },
    },
    plugins: [
      new PurgecssPlugin({
        paths: glob.sync([
          path.join(__dirname, './src/index.html'),
          path.join(__dirname, './**/*.vue'),
          path.join(__dirname, './src/**/*.js')
        ])
      })
    ]

  },

  chainWebpack: config => {
    config
      .plugin("html")
      .tap(args => {
        args[0].template = "./index.html"
        return args
      })

    const options = {
      openAnalyzer: false,
      analyzerHost: 'localhost'
    }

    if(process.env.NODE_ENV==='production' || process.env.electron==='true') {
      options.analyzerMode = 'static'
    }
    config
      .plugin("webpack-bundle-analyzer")
      .use(BundleAnalyzerPlugin)
      .init(Plugin => new Plugin(options));
  },

  pluginOptions: {
    moment: {
      locales: [
        'fr',
        'en-gb'
      ]
    },
    i18n: {
      locale: 'fr',
      fallbackLocale: 'en',
      localeDir: 'locales',
      enableInSFC: true
    }
  }
}
