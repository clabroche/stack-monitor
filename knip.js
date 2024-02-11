/** @type {import('knip').KnipConfig} */
module.exports = {
  workspaces: {
    '.': {
      entry: ['./runScriptWithEnv.js', './watch.js', './stack.js'],
    },
    'fronts/app': {
      vue: true,
      ignore: ['node_modules/**/*'],
      ignoreDependencies: [
        '@fortawesome/fontawesome-free',
      ],
      entry: ['src/**/*.ts!', 'src/**/*.vue!', 'src/**/*.js!', 'babel.config.js'],
      project: ['**/*.ts!', '**/*.vue!', '**/*.js!'],
    },
    'modules/bugs/backend': {
      entry: ['checkJsFork.js'],
      project: ['**/*.ts!', '**/*.js!'],
    },
    'servers/server': {
      ignore: ['node_modules', 'bin/www'],
      entry: ['src/{index,cli,server}.js!', 'src/{index,cli,server}.ts!', '**/*.spec.(js|ts)', '**/*.test.(js|ts)', 'tsup.config.ts', '**/*/bin/www', 'helpers/cpuFork.js', 'tests/**/*.js'],
      project: ['**/*.ts!', '**/*.js!', '**/*/bin/www'],
    },
    'common/*': {
      entry: ['src/{index,cli,server}.js!', 'src/{index,cli,server}.ts!', '**/*.spec.(js|ts)', '**/*.test.(js|ts)', 'tsup.config.ts', 'src/transport.js', 'src/walkerFork.js'],
      project: ['**/*.ts!', '**/*.js!'],
    },
    'modules/*/front': {
      vue: true,
      ignore: ['node_modules/**/*'],
      entry: ['src/**/*.vue'],
      project: ['**/*.ts!', '**/*.vue!', '**/*.js!'],
    },
  },
  ignoreDependencies: [
    '@clabroche/common-retrigger-all-build',
    '@swc/jest',
    'jest-sonar-reporter',
    '@types/*',
    'knip',
    '@lerna-lite/*',
    'turbo',
    '@commitlint/*',
  ],
  ignore: [
    '**/*/jest.config.js',
  ],
  ignoreWorkspaces: [
    'common/jest',
    'fronts/docs',
  ],
};
