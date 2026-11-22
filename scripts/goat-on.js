#!/usr/bin/env node
// goat: switch the loop guard back on by clearing the flag at ~/.goat-off.
const fs = require('fs');
const { flagPath } = require('./flag');

fs.rmSync(flagPath(), { force: true });
process.stdout.write('goat flag cleared: ON');
