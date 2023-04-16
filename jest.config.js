const path = require('path')
module.exports = {
  rootDir: path.resolve(__dirname, 'server'),
  moduleFileExtensions: ['js'],
  testMatch: ['**/src/**/*.spec.(js)', '**/tests/**/*.spec.(js)'],
  collectCoverage: process.env.coverage === 'false' ? false : true,
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!**/public/**',
    '!**/gulpfile.js',
    '!*.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'testconfig.js',
    'package.json',
    'package-lock.json',
  ],
  testResultsProcessor: 'jest-sonar-reporter',
}
