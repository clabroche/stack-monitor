var nodeExternals = require('webpack-node-externals')

module.exports = {
  entry: {
    cli: './src/index.js'
  },
  output: {
    filename: 'bundle.js',
    libraryTarget: 'commonjs'
  },
  target: 'node',
  externals: [nodeExternals()],
  module: {
    // module.rules is the same as module.loaders in 1.x
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      }
    ]
  }
}
