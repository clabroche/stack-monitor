import { existsSync, readFileSync} from 'fs';
import { copyFile, cp, mkdir, readFile, rm, writeFile } from 'fs/promises';
import { defineConfig } from 'tsup';
import path from 'path'
import { execSync } from 'child_process';
import PromiseB from 'bluebird';

const rootPath = path.resolve(__dirname, '../../')
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
    await rm(path.resolve(__dirname, 'dist'), {recursive: true, force: true})
    build.onResolve({ filter: /.*/ }, async (args) => {
      return { external: false };
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
    if(!existsSync(path.resolve(__dirname, "dist"))) await mkdir(path.resolve(__dirname, "dist"))
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
    packageJSON.types = 'index.d.ts'
    packageJSON.typings = 'index.d.ts'
    packageJSON.name = '@iryu54/stack-monitor'
    await writeFile(path.resolve(__dirname, './dist/package.json'), JSON.stringify(packageJSON, null, 2), 'utf-8')
    try {
      await execSync('npx tsc --declaration --allowJS --outFile dist/index.ts --emitDeclarationOnly --target ES2021 --moduleResolution nodenext --module NodeNext --types @clabroche/common-typings ../../common/typings/src/index.ts', {stdio: 'inherit', cwd: __dirname})
      await execSync('npx tsc --declaration --allowJS --outFile dist/stack.ts --emitDeclarationOnly --target ES2021 --moduleResolution nodenext --module NodeNext --types @clabroche/common-typings --allowJs ./models/stack.js', {stdio: 'inherit', cwd: __dirname})
    } catch (error) {
      console.error(error)
    }
    const dTsPath = path.resolve(__dirname, './dist/index.d.ts')
    await writeFile(dTsPath, readFileSync(dTsPath, 'utf-8').replaceAll(`@clabroche/common-typings`, `common/typings/src/index`), 'utf-8')
    await writeFile(dTsPath, readFileSync(dTsPath, 'utf-8').replaceAll(`servers/server/models/stack`, `@iryu54/stack-monitor`), 'utf-8')
  },
};

const copyFilePlugin = {
  name: 'copyFilePlugin',
  async setup(build) {
    console.log('copyFilePlugin')
    if(!existsSync(path.resolve(__dirname, "dist"))) await mkdir(path.resolve(__dirname, "dist"))
    await copyFile(path.resolve(__dirname, "../../modules/bugs/backend/checkJsFork.js"), "dist/checkJsFork.js")
    await copyFile(path.resolve(__dirname, "../../modules/bugs/backend/defaultJsConfig.json"), "dist/defaultJsConfig.json")
    await copyFile(path.resolve(__dirname, "./helpers/cpuFork.js"), "dist/cpuFork.js")
  }
}

const integrateWebApp = {
  name: 'integrateWebApp',
  async setup(build) {
    build.onEnd(async () => {
      console.log('integrateWebApp')
      if(!existsSync(path.resolve(__dirname, "dist"))) await mkdir(path.resolve(__dirname, "dist"))
      execSync('yarn turbo build --filter=@clabroche/fronts-app', {cwd: path.resolve(__dirname, '../..'), stdio: 'inherit'})
      if(existsSync(path.resolve(__dirname, './dist/public'))) await rm(path.resolve(__dirname, './dist/public'), {recursive: true, force: true})
      await cp(path.resolve(__dirname, '../../fronts/app/dist'), path.resolve(__dirname, './dist/public'), {recursive: true})
      console.log('integrate extension')
      execSync('yarn turbo build --filter=@clabroche/modules-vscode-extension', {cwd: path.resolve(__dirname, '../..'), stdio: 'inherit'})
      await cp(path.resolve(__dirname, '../../modules/vscode/extension/out/stack-monitor.vsix'), path.resolve(__dirname, './dist/stack-monitor.vsix'), {recursive: true})
    })
  }
}

export default defineConfig({
  entry: ['./bin/www'],
  clean: true,
  bundle: true,
  publicDir: './src/public',
  esbuildPlugins: [
    // makeAllPackagesExternalPlugin,
    copyFilePlugin,
    integrateWebApp,
    syncPackageJSON,
  ],
  noExternal: [
    /@clabroche\/.*/,
  ],
  sourcemap: true,
});
