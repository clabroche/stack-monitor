import { existsSync} from 'fs';
import { copyFile, mkdir, rm, readFile } from 'fs/promises';
import { defineConfig } from 'tsup';
import path from 'path'
import { execSync } from 'child_process';
import PromiseB from 'bluebird';
import fse, { copy } from 'fs-extra';

const rootPath = path.resolve(__dirname, '../../')
const workspaces = execSync('yarn workspaces list --json', {cwd: rootPath, encoding: 'utf-8'}).trim().split('\n').map(a => JSON.parse(a))

async function findPackageDepsFromInternalPackages(packageName) {
  const workspacePath = workspaces.find(b => b.name === packageName)
  if(workspacePath) {
    const packageJSON = await fse.readJson(path.resolve(rootPath, workspacePath.location, 'package.json'))
    if(packageJSON.dependencies) {
      const deps = await PromiseB.map(Object.keys(packageJSON.dependencies), (packageNameDep) => {
        if (/@clabroche\/*/.test(packageNameDep)) {
          return findPackageDepsFromInternalPackages(packageNameDep)
        }
        return {name: packageNameDep, version: packageJSON.dependencies[packageNameDep]}
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
    const packageJSON = await fse.readJson(path.resolve(__dirname, 'package.json'))
    const deps = await findPackageDepsFromInternalPackages(packageJSON.name)
    deps.forEach((dep) => {
      if(!packageJSON.dependencies[dep.name]) {
        console.log('missing', dep.name, dep.version)
      }
    })
    process.exit(0)
  },
};

const copyFilePlugin = {
  name: 'copyFilePlugin',
  async setup(build) {
    if(!existsSync(path.resolve(__dirname, "dist"))) await mkdir(path.resolve(__dirname, "dist"))
    await copyFile(path.resolve(__dirname, "../../common/express-logger/src/transport.js"), "dist/transport.js")
    await copyFile(path.resolve(__dirname, "../../modules/bugs/checkJsFork.js"), "dist/checkJsFork.js")
    await copyFile(path.resolve(__dirname, "../../modules/bugs/defaultJsConfig.json"), "dist/defaultJsConfig.json")
    await copyFile(path.resolve(__dirname, "./helpers/cpuFork.js"), "dist/cpuFork.js")
    await copyFile(path.resolve(__dirname, "./bin/www"), "dist/www")
  }
}

const integrateWebApp = {
  name: 'integrateWebApp',
  async setup(build) {
    build.onEnd(async () => {
      console.log('Build front')
      throw new Error('')
      if(!existsSync(path.resolve(__dirname, "dist"))) await mkdir(path.resolve(__dirname, "dist"))
      execSync('yarn turbo build --filter=@clabroche/fronts-app', {cwd: path.resolve(__dirname, '../..'), stdio: 'inherit'})
      if(existsSync(path.resolve(__dirname, './dist/public'))) await rm(path.resolve(__dirname, './dist/public'), {recursive: true, force: true})
      await copy(path.resolve(__dirname, '../../fronts/app/dist'), path.resolve(__dirname, './dist/public'))
    })
  }
}

export default defineConfig({
  entry: ['./bin/server.js'],
  clean: true,
  publicDir: './src/public',
  esbuildPlugins: [
    makeAllPackagesExternalPlugin,
    syncPackageJSON,
    copyFilePlugin,
    integrateWebApp,
  ],
  noExternal: [
    /@clabroche\/.*/,
  ],
  sourcemap: true,
});
