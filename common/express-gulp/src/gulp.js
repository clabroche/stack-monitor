#!/usr/bin/env node
const { spawn } = require('child_process');
const pathfs = require('path');

spawn('gulp', { cwd: pathfs.resolve('.'), stdio: 'inherit' });
