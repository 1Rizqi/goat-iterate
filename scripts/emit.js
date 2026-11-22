#!/usr/bin/env node
// goat: inject the rules into the main session (SessionStart) and into every subagent (SubagentStart),
// because SessionStart context never reaches subagents. Standalone for agents without hook wiring:
// `node scripts/emit.js session` or `node scripts/emit.js subagent`.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { flagPath } = require('./flag');

const root = process.env.CLAUDE_PLUGIN_ROOT || path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, 'rules', name), 'utf8');
const OFF_LINE = 'goat is OFF (the user turns it back on with goat-on). Start the iterate loop only when the user asks for it.';

// Hook mode (no argument) reads the hook JSON from stdin; standalone mode takes session|subagent.
let input = {};
if (!process.argv[2]) {
  try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { /* empty stdin: treat as a regular session */ }
}

const mode = (process.argv[2] === 'subagent' || input.hook_event_name === 'SubagentStart') ? 'subagent' : 'session';
const off = fs.existsSync(flagPath());

if (mode === 'subagent') {
  // When off, subagents receive no rules at all.
  if (!off) {
    // SubagentStart requires JSON form; some clients discard raw text.
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'SubagentStart', additionalContext: read('subagent.md') },
    }));
  }
} else if (off) {
  // One line only: the iterate skill description still loads, so the loop is prevented from starting on its own.
  process.stdout.write(OFF_LINE);
} else {
  let out = read('session.md');
  if (input.source === 'compact') {
    // After compact, each round's commit (which holds the score) restores the loop history.
    try {
      // On Windows, 'git' without .exe can fail with ENOENT even when git is on PATH.
      const git = process.platform === 'win32' ? 'git.exe' : 'git';
      out += '\n\nRecent commits:\n' + execFileSync(git, ['log', '--oneline', '-8'], {
        cwd: input.cwd || process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch { /* not a git repo: skip */ }
  }
  process.stdout.write(out);
}
