#!/bin/env node
const path = require('path')
process.title = "stack-monitor"
let ________________stack_____________________ = [];
try {
  if(process.argv[2]) {
    const confPath = path.resolve(process.argv[2]) 
    ________________stack_____________________ = confPath ? require(confPath) : []
    chooseStackToLaunch()
  } else {
    console.error('Provide path to config as argument')
    process.exit(1)
  }
} catch (error) {
  throw new Error(path.resolve(process.argv[2]) + ' not found')
}

function chooseStackToLaunch() {
  
}