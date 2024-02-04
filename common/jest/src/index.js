#!/usr/bin/env node
require('fix-esm').register();
require('jest').run([...process.argv.slice(2)]);
