#!/usr/bin/env node
// goat: switch the loop guard off. Only the user runs this; it writes the flag at ~/.goat-off.
const fs = require('fs');
const { flagPath } = require('./flag');

fs.writeFileSync(flagPath(), '');
process.stdout.write('goat flag set: OFF (the loop stays off until the flag is cleared)');
