#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

process.chdir('C:\\Users\\grent\\.openclaw\\workspace\\testing');

try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('SUCCESS');
  process.exit(0);
} catch (e) {
  process.exit(1);
}