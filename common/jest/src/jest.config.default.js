const { existsSync } = require('fs');
const path = require('path');

const setupFiles = [path.resolve(__dirname, 'setEnvVars.js')];
if (existsSync(path.resolve('.jest', 'setEnvVars.js'))) setupFiles.push(path.resolve('', '.jest', 'setEnvVars.js'));
module.exports = {
  rootDir: path.resolve(),
  moduleFileExtensions: ['js', 'ts'],
  setupFiles,
  clearMocks: true,
  testMatch: ['**/src/**/*.spec.(js)', '**/?(*.)+(spec|test).[tj]s?(x)', '**/tests/**/*.spec.(js)'],
  modulePathIgnorePatterns: [],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.idea/',
    '/.build/',
  ],
  collectCoverage: process.env.coverage !== 'false',
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!**/gulpfile.js',
    '!*.js',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.idea/',
    '/.build/',
    'testconfig.js',
    'package.json',
    'package-lock.json',
  ],
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  testResultsProcessor: 'jest-sonar-reporter',
  transformIgnorePatterns: [
  ],
};
