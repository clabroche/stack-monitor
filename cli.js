#!/bin/env node
const path = require('path')
let ________________stack_____________________ = [];
try {
  if(process.argv[2]) {
    const confPath = path.resolve(process.argv[2]) 
    ________________stack_____________________ = confPath ? require(confPath) : []
    chooseStackToLaunch()
  } else {
    console.error('Provide path to config as argument')
  }
} catch (error) {
  throw new Error(path.resolve(process.argv[2]) + ' not found')
}

function chooseStackToLaunch() {
  
}