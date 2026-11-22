#!/usr/bin/env node
// goat: the lead edits at most 3 files itself per session; text rules are ignored by the model, so the hook enforces it.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { flagPath } = require('./flag');

const LIMIT = 3;

// Windows uses \ and letter case is inconsistent for the same file.
const norm = (p) => path.resolve(p).replace(/\\/g, '/').toLowerCase();
const under = (file, dir) => file.startsWith(norm(dir) + '/');

// Agent config dirs are exempt (loop state, memory and plans live there, not deliverables):
// the original exempted ~/.claude; the port also exempts the Hermes config dir when it can find it.
// GOAT_CONFIG_DIRS (path-delimiter separated) overrides the defaults (tests use it).
const configDirs = () => {
  if (process.env.GOAT_CONFIG_DIRS) return process.env.GOAT_CONFIG_DIRS.split(path.delimiter).filter(Boolean);
  const dirs = [path.join(os.homedir(), '.claude')];
  dirs.push(process.env.HERMES_CONFIG_DIR || process.env.HERMES_HOME
    || (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'hermes') : path.join(os.homedir(), '.hermes')));
  return dirs;
};

try {
  let input;
  try { input = JSON.parse(fs.readFileSync(0, 'utf8')); } catch { process.exit(0); }
  const raw = input && input.tool_input && input.tool_input.file_path;
  const cmd = input && input.tool_input && input.tool_input.command;
  const sid = String((input && input.session_id) || '').replace(/[^A-Za-z0-9-]/g, '');
  // Shell commands (Bash/PowerShell) are only checked for the off flag; everything else about them is allowed.
  // shortcut: a plain substring check, so a split string like .goat"-off" slips through; upgrade to a shell parser if a work-around shows up in a session.
  const shell = typeof cmd === 'string';
  if (shell ? !cmd.toLowerCase().includes('.goat-off') : (!raw || !sid)) process.exit(0);
  if (fs.existsSync(flagPath())) process.exit(0);

  const file = shell ? '.goat-off' : norm(raw);
  // The off switch is the user's alone: inside an exempt config dir, a denied lead could otherwise lift its own limit.
  let reason = 'goat: only the user can switch goat off; ask them instead of touching this file.';
  if (path.basename(file) !== '.goat-off') {
    // Subagents are unrestricted (that is where the work goes), except for the off flag above.
    if (input.agent_id) process.exit(0);
    // Loop state, git metadata (.git/info/exclude), agent config and scratch must be written by the lead itself; they are not deliverable files.
    if (file.includes('/.iterate/') || file.includes('/.git/') || under(file, os.tmpdir()) || configDirs().some((d) => under(file, d))) process.exit(0);

    const stateFile = path.join(os.tmpdir(), 'goat-delegate-' + sid);
    // Record first, then recount: parallel hooks all append, and only the first LIMIT distinct entries win.
    fs.appendFileSync(stateFile, file + '\n');
    const first = [...new Set(fs.readFileSync(stateFile, 'utf8').split('\n').filter(Boolean))].slice(0, LIMIT);
    if (first.includes(file)) process.exit(0);
    reason = `goat: you have already edited ${LIMIT} files yourself in this chat (limit ${LIMIT}). Brief a builder for this change (low tier for mechanical edits, medium tier otherwise) and verify its result; files you already touched stay editable. If you cannot brief a builder, stop and ask the user: only the user can switch goat off, and writing the file through Bash, PowerShell or node is no way around this limit.`;
  }
  // Denied paths are recorded too, but are never among the first LIMIT, so a retry is denied again.
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
} catch { /* fail open */ }
