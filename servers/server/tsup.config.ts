import { existsSync, readFileSync} from 'fs';
import { copyFile, cp, mkdir, readFile, rm, writeFile } from 'fs/promises';
import { defineConfig } from 'tsup';
import path from 'path'
import { execSync } from 'child_process';
import PromiseB from 'bluebird';
import compressing from 'compressing';

const rootPath = path.resolve(__dirname, '../../')
const distPath = process.env.DIST_PATH
  ? path.resolve(process.env.DIST_PATH)
  : path.resolve(__dirname, "dist")
console.log(distPath)
const publicPath = path.resolve(distPath, 'public')

const workspaces = execSync('yarn workspaces list --json', {cwd: rootPath, encoding: 'utf-8'}).trim().split('\n').map(a => JSON.parse(a))

async function findPackageDepsFromInternalPackages(packageName) {
  const workspacePath = workspaces.find(b => b.name === packageName)
  if(workspacePath) {
    const packageJSON = JSON.parse(await readFile(path.resolve(rootPath, workspacePath.location, 'package.json'), 'utf-8'))
    if(packageJSON.dependencies) {
      const deps = await PromiseB.map(Object.keys(packageJSON.dependencies), (packageNameDep) => {
        if (/@clabroche\/*/.test(packageNameDep)) {
          return findPackageDepsFromInternalPackages(packageNameDep)
        }
        return {name: packageNameDep, version: packageJSON.dependencies[packageNameDep], from: packageName}
      })
      return deps.flat(1000)
    }
  } 
  return []
}
const makeAllPackagesExternalPlugin = {
  name: 'make-all-packages-external',
  async setup(build) {
    await rm(distPath, {recursive: true, force: true})
    build.onResolve({ filter: /.*/ }, async (args) => {
      if (!/^(#|\/|\.\/|\.\.\/)/.test(args.path)) {
        if (/@clabroche\/*/.test(args.path)) {
          return { external: false };
        }
        return { external: true };
      }
      return { external: false };
    });
  },
};

const syncPackageJSON = {
  name: 'sync-package-json',
  async setup(build) {
    console.log('sync-package-json')
    if(!existsSync(distPath)) await mkdir(distPath)
    const packageJSON = JSON.parse(await readFile(path.resolve(__dirname, 'package.json'), 'utf-8'))
    const deps = await findPackageDepsFromInternalPackages(packageJSON.name)
    deps.forEach((dep) => {
      if(!packageJSON.dependencies[dep.name]) {
        console.log('Add', dep.name, dep.version, 'from', dep.from)
        packageJSON.dependencies[dep.name] = dep.version
      }
    })
    Object.keys(packageJSON.dependencies).forEach((packageName) => {
      if(packageJSON.dependencies[packageName] === 'workspace:*')  delete packageJSON.dependencies[packageName]

    })
    delete packageJSON.private
    delete packageJSON.devDependencies
    packageJSON.bin = 'www.js'
    packageJSON.main = 'stack.js'
    packageJSON.name = '@iryu54/stack-monitor'
    await writeFile(path.resolve(distPath, 'package.json'), JSON.stringify(packageJSON, null, 2), 'utf-8')
  },
};

const copyFilePlugin = {
  name: 'copyFilePlugin',
  async setup(build) {
    console.log('copyFilePlugin')
    if(!existsSync(distPath)) await mkdir(distPath)
    await copyFile(path.resolve(__dirname, "../../modules/bugs/backend/checkJsFork.js"), path.resolve(distPath, "checkJsFork.js"))
    await copyFile(path.resolve(__dirname, "../../modules/bugs/backend/defaultJsConfig.json"), path.resolve(distPath, "defaultJsConfig.json"))
    await copyFile(path.resolve(__dirname, "./helpers/cpuFork.js"), path.resolve(distPath, "cpuFork.js"))
  }
}

const integrateWebApp = {
  name: 'integrateWebApp',
  async setup(build) {
    build.onEnd(async () => {
      console.log('integrateWebApp')
      if(!existsSync(distPath)) await mkdir(distPath)
      execSync('yarn turbo build --filter=@clabroche/fronts-app', {cwd: path.resolve(__dirname, '../..'), stdio: 'inherit'})
      if(existsSync(publicPath)) await rm(publicPath, {recursive: true, force: true})
      await cp(path.resolve(__dirname, '../../fronts/app/dist'), publicPath, {recursive: true})
      console.log('integrate extension')
      execSync('yarn turbo build --filter=@clabroche/modules-vscode-extension', {cwd: path.resolve(__dirname, '../..'), stdio: 'inherit'})
      await cp(path.resolve(__dirname, '../../modules/vscode/extension/out/stack-monitor.vsix'), path.resolve(distPath, 'stack-monitor.vsix'), {recursive: true})
      const modulePath = path.resolve(__dirname, '../../modules/workflows/backend/nodes')
      const packageJSON = JSON.parse(await readFile(path.resolve(modulePath, 'package.json'), 'utf-8'))
      await compressing.tar.compressDir(
        modulePath,
        path.resolve(distPath, `${packageJSON.name}.tar`),
         {ignoreBase: true, relativePath: 'package'}
      )
    })
  }
}

export default defineConfig({
  entry: ['./bin/www'],
  outDir: distPath,
  clean: true,
  bundle: true,
  publicDir: './src/public',
  esbuildPlugins: [
    makeAllPackagesExternalPlugin,
    copyFilePlugin,
    integrateWebApp,
    syncPackageJSON,
  ],
  noExternal: [
    /@clabroche\/.*/,
  ],
  sourcemap: true,
});
