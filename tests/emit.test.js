// Tests for the emit.js and off/on guard scripts: run `node --test tests/emit.test.js` from the repo root.
// GOAT_HOME points to a temp folder, so the real off flag is not touched.
const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.join(__dirname, '..');
const git = process.platform === 'win32' ? 'git.exe' : 'git';

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'goat-test-'));
}

function run(script, { input, args = [], home = tempDir() } = {}) {
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], {
    input: input === undefined ? '' : typeof input === 'string' ? input : JSON.stringify(input),
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: root, GOAT_HOME: home },
    encoding: 'utf8',
  });
  assert.strictEqual(r.status, 0, r.stderr);
  return r.stdout;
}

const emit = (input, home) => run('emit.js', { input, home });

test('startup prints the session rules and nothing from git', () => {
  const out = emit({ hook_event_name: 'SessionStart', source: 'startup', cwd: tempDir() });
  assert.match(out, /^GOAT MODE ACTIVE/);
  assert.doesNotMatch(out, /Recent commits/);
});

test('compact inside a git repo appends recent commits', () => {
  const dir = tempDir();
  const g = (...args) => execFileSync(git, args, { cwd: dir, stdio: 'ignore' });
  g('init', '-q');
  g('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'round 2: 7.5/10');
  const out = emit({ hook_event_name: 'SessionStart', source: 'compact', cwd: dir });
  assert.match(out, /^GOAT MODE ACTIVE/);
  assert.match(out, /Recent commits:\n[0-9a-f]+ round 2: 7\.5\/10/);
});

test('compact outside a git repo prints the rules only', () => {
  const out = emit({ hook_event_name: 'SessionStart', source: 'compact', cwd: tempDir() });
  assert.match(out, /^GOAT MODE ACTIVE/);
  assert.doesNotMatch(out, /Recent commits/);
});

test('subagent start returns the subagent rules as hook JSON', () => {
  const out = JSON.parse(emit({ hook_event_name: 'SubagentStart', agent_type: 'Explore' }));
  assert.strictEqual(out.hookSpecificOutput.hookEventName, 'SubagentStart');
  assert.match(out.hookSpecificOutput.additionalContext, /^GOAT subagent rules/);
  // standalone mode prints the same hook JSON
  const solo = JSON.parse(run('emit.js', { args: ['subagent'] }));
  assert.strictEqual(solo.hookSpecificOutput.hookEventName, 'SubagentStart');
  assert.match(solo.hookSpecificOutput.additionalContext, /^GOAT subagent rules/);
});

test('empty or broken stdin still prints the session rules (both modes)', () => {
  assert.match(emit(), /^GOAT MODE ACTIVE/);
  assert.match(emit('{not json'), /^GOAT MODE ACTIVE/);
  assert.match(run('emit.js', { args: ['session'] }), /^GOAT MODE ACTIVE/);
});

test('off: session gets one guard line, subagents get nothing', () => {
  const home = tempDir();
  assert.match(run('goat-off.js', { home }), /^goat flag set: OFF/);
  assert.ok(fs.existsSync(path.join(home, '.goat-off')));

  const session = emit({ hook_event_name: 'SessionStart', source: 'startup' }, home);
  assert.match(session, /^goat is OFF/);
  assert.match(session, /only when the user asks for it/);
  assert.doesNotMatch(session, /GOAT MODE ACTIVE/);
  assert.strictEqual(emit({ hook_event_name: 'SubagentStart' }, home), '');
});

test('on: removes the flag, prints the rules, and hooks inject again', () => {
  const home = tempDir();
  run('goat-off.js', { home });
  assert.match(run('goat-on.js', { home }), /^goat flag cleared: ON/);
  assert.ok(!fs.existsSync(path.join(home, '.goat-off')));
  assert.match(emit({ hook_event_name: 'SessionStart', source: 'startup' }, home), /^GOAT MODE ACTIVE/);
  // running on twice does not fail
  assert.match(run('goat-on.js', { home }), /^goat flag cleared: ON/);
});
