const path = require('path')
let stackConfig = [];
try {
  if(process.argv[2]) {
    const confPath = path.resolve(process.argv[2]) 
    stackConfig = confPath ? require(confPath) : []
  } else {
    console.error('Provide path to config as argument')
    process.exit(1)
  }
} catch (error) {
  throw new Error(path.resolve(process.argv[2]) + ' not found')
}

module.exports = {
  stackConfig,
  stack: [],
  getStack() {
    return this.stack
  }
}