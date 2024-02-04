import { defineConfig } from 'tsup';

const makeAllPackagesExternalPlugin = {
  name: 'make-all-packages-external',
  setup(build) {
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

export default defineConfig({
  entry: ['./src/index.ts','./src/walkerForks.js',],
  clean: true,
  esbuildPlugins: [
    makeAllPackagesExternalPlugin,
  ],
  noExternal: [
    /@clabroche\/.*/,
  ],
  sourcemap: true,
});
