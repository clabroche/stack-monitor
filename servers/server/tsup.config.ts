import { existsSync} from 'fs';
import { copyFile, mkdir, rm } from 'fs/promises';
import { defineConfig } from 'tsup';
import path from 'path'
import { execSync } from 'child_process';
import { copy } from 'fs-extra';

const makeAllPackagesExternalPlugin = {
  name: 'make-all-packages-external',
  async setup(build) {
    await rm(path.resolve(__dirname, 'dist'), {recursive: true, force: true})
    build.onResolve({ filter: /.*/ }, (args) => {
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
    copyFilePlugin,
    integrateWebApp,
  ],
  noExternal: [
    /@clabroche\/.*/,
  ],
  sourcemap: true,
});
