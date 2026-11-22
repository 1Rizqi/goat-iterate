#!/usr/bin/env node
// goat: location of the "off" flag. Stored in the user's home directory, not in the plugin,
// so it stays in effect after the plugin is updated or reinstalled. GOAT_HOME overrides the
// home directory (tests use it); the default is os.homedir().
const os = require('os');
const path = require('path');

const flagPath = () =>
  path.join(process.env.GOAT_HOME || os.homedir(), '.goat-off');

module.exports = { flagPath };
