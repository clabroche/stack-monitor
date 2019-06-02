const fs = require('fs')
const path = require('path')
const bundlePath = path.resolve(__dirname, 'bundle.js')
const cliPath = path.resolve(__dirname, 'cli.js')
let bundle = fs.readFileSync(bundlePath, 'utf-8')
let cli = fs.readFileSync(cliPath, 'utf-8')
bundle = `${cli}
${bundle}`

fs.writeFileSync(bundlePath, bundle ,'utf-8')