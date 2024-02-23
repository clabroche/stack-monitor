const { execSync } = require('child_process');

const path = require('path');

const {
  cpSync, existsSync, mkdirSync, readFileSync,
  writeFileSync,
  rmSync,
} = require('fs');

if (existsSync(path.resolve(__dirname, './out'))) {
  rmSync(path.resolve(__dirname, './out'), { recursive: true, force: true });
}
if (!existsSync(path.resolve(__dirname, './out'))) {
  mkdirSync(path.resolve(__dirname, './out'));
}
if (!existsSync(path.resolve(__dirname, './out/src'))) {
  mkdirSync(path.resolve(__dirname, './out/src'));
}
execSync('esbuild ./src/extension.js --bundle --outfile=out/src/main.js --external:vscode --format=cjs --platform=node', { stdio: 'inherit', cwd: __dirname });
cpSync(path.resolve(__dirname, './package.json'), path.resolve(__dirname, './out/package.json'));
cpSync(path.resolve(__dirname, './resources'), path.resolve(__dirname, './out/resources'), { recursive: true });
let packageJSON = readFileSync(path.resolve(__dirname, './out/package.json'), 'utf-8');
packageJSON = packageJSON
  .replaceAll('"main": "./src/extension.js",', '"main": "./src/main.js",')
  .replaceAll('"name": "@clabroche/modules-vscode-extension",', '"name": "stack-monitor",');

writeFileSync(path.resolve(__dirname, './out/package.json'), packageJSON, 'utf-8');
writeFileSync(path.resolve(__dirname, './out/LICENSE'), 'MIT', 'utf-8');
execSync('npm i --omit=dev', { stdio: 'inherit', cwd: path.resolve(__dirname, './out') });
execSync('vsce package -o stack-monitor.vsix', { stdio: 'inherit', cwd: path.resolve(__dirname, './out') });
if (existsSync(path.resolve(__dirname, '../backend'))) {
  cpSync(path.resolve(__dirname, './out/stack-monitor.vsix'), path.resolve(__dirname, '../backend/stack-monitor.vsix'));
}
