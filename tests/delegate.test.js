// Tests for the delegate.js guard: run `node --test tests/` from the repo root.
const { test, after } = require('node:test');
const assert = require('node:assert');
const { spawnSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const nodePath = require('node:path');

const script = nodePath.join(__dirname, '..', 'scripts', 'delegate.js');
const dir = fs.mkdtempSync(nodePath.join(os.tmpdir(), 'goat-test-delegate-'));
// Fake repo outside tmpdir: paths under tmpdir are exempt in the guard. The guard only reads the path, it never opens the file.
const repo = nodePath.resolve('/goat-test-repo');
const sessions = [];
let n = 0;

const sid = () => `test-${process.pid}-${n++}`;
const file = (name) => nodePath.join(repo, 'src', name);

function run(input, home = dir) {
  const r = spawnSync(process.execPath, [script], {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    env: { ...process.env, GOAT_HOME: home, GOAT_CONFIG_DIRS: home },
    encoding: 'utf8',
  });
  assert.strictEqual(r.status, 0, r.stderr);
  return r.stdout;
}

function edit(session_id, file_path, extra = {}, home) {
  sessions.push(session_id);
  return run({ session_id, hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path }, ...extra }, home);
}

function assertDenied(out) {
  const o = JSON.parse(out).hookSpecificOutput;
  assert.strictEqual(o.hookEventName, 'PreToolUse');
  assert.strictEqual(o.permissionDecision, 'deny');
  assert.match(o.permissionDecisionReason, /brief a builder/);
}

const fill = (s, home) => ['a.js', 'b.js', 'c.js'].map((f) => edit(s, file(f), {}, home));

after(() => {
  fs.rmSync(dir, { recursive: true, force: true });
  for (const s of sessions) fs.rmSync(nodePath.join(os.tmpdir(), `goat-delegate-${s}`), { force: true });
});

test('lead files 1-3 pass', () => {
  assert.deepStrictEqual(fill(sid()), ['', '', '']);
});

test('4th and 5th distinct files are denied, the reason names no goat-off and no fixed ordinal', () => {
  const s = sid();
  fill(s);
  for (const f of ['d.js', 'e.js']) {
    const out = edit(s, file(f));
    assertDenied(out);
    const reason = JSON.parse(out).hookSpecificOutput.permissionDecisionReason;
    assert.match(reason, /already edited 3 files/);
    assert.match(reason, /only the user/);
    assert.match(reason, /Bash/);
    assert.doesNotMatch(reason, /goat-off|4th/);
  }
});

test('a denied path stays denied on retry', () => {
  const s = sid();
  fill(s);
  assertDenied(edit(s, file('d.js')));
  assertDenied(edit(s, file('d.js')));
});

test('MultiEdit counts like Edit: 3 files pass, the 4th is denied', () => {
  const s = sid();
  const multi = (f) => edit(s, file(f), { tool_name: 'MultiEdit' });
  assert.deepStrictEqual(['a.js', 'b.js', 'c.js'].map(multi), ['', '', '']);
  assertDenied(multi('d.js'));
});

test('a touched file passes again after a deny, whatever its case or slashes', () => {
  const s = sid();
  fill(s);
  assertDenied(edit(s, file('d.js')));
  assert.strictEqual(edit(s, file('a.js')), '');
  assert.strictEqual(edit(s, file('b.js').toUpperCase().replace(/\\/g, '/')), '');
});

test('subagent edits (agent_id) are silent at any count and not counted', () => {
  const s = sid();
  for (const f of ['p.js', 'q.js', 'r.js', 's.js', 't.js']) assert.strictEqual(edit(s, file(f), { agent_id: 'a1' }), '');
  assert.deepStrictEqual(fill(s), ['', '', '']);
  assert.strictEqual(edit(s, file('u.js'), { agent_id: 'a1' }), '');
  assertDenied(edit(s, file('u.js')));
});

test('off flag silences the guard, the same sequence without it denies', () => {
  const home = fs.mkdtempSync(nodePath.join(dir, 'home-'));
  fs.writeFileSync(nodePath.join(home, '.goat-off'), '');
  const s = sid();
  assert.deepStrictEqual(fill(s, home), ['', '', '']);
  assert.strictEqual(edit(s, file('d.js'), {}, home), '');
  assert.strictEqual(edit(s, file('e.js'), {}, home), '');
  const t = sid();
  fill(t);
  assertDenied(edit(t, file('d.js')));
});

test('broken stdin or missing fields print nothing', () => {
  assert.strictEqual(run(''), '');
  assert.strictEqual(run('{not json'), '');
  assert.strictEqual(run('null'), '');
  assert.strictEqual(run({ session_id: sid(), tool_input: {} }), '');
  assert.strictEqual(run({ session_id: sid() }), '');
  // Without session_id nothing is counted, and nothing is written to a shared state file.
  for (const f of ['a.js', 'b.js', 'c.js', 'd.js']) {
    assert.strictEqual(run({ tool_input: { file_path: file(f) } }), '');
    assert.strictEqual(run({ session_id: '!!', tool_input: { file_path: file(f) } }), '');
  }
  assert.ok(!fs.existsSync(nodePath.join(os.tmpdir(), 'goat-delegate-')));
});

test('another session starts fresh', () => {
  const s = sid();
  fill(s);
  assertDenied(edit(s, file('d.js')));
  assert.strictEqual(edit(sid(), file('d.js')), '');
});

test('loop state, config dir and tmpdir paths pass after 3 files and are not counted', () => {
  // Config dir outside tmpdir, so the config-dir exemption is tested on its own.
  const home = nodePath.join(repo, 'home', '.claude');
  const s = sid();
  fill(s, home);
  for (const p of [
    nodePath.join(repo, '.iterate', 'x', 'state.md'),
    nodePath.join(home, 'projects', 'p', 'memory', 'm.md'),
    nodePath.join(os.tmpdir(), 'x.py'),
  ]) assert.strictEqual(edit(s, p, { tool_name: 'Write' }, home), '');
  assertDenied(edit(s, file('d.js'), {}, home));
});

test('git metadata (.git/info/exclude) passes before and after 3 files and is not counted', () => {
  const s = sid();
  const exclude = nodePath.join(repo, '.git', 'info', 'exclude');
  assert.deepStrictEqual([edit(s, file('a.js')), edit(s, file('b.js'))], ['', '']);
  assert.strictEqual(edit(s, exclude, { tool_name: 'Write' }), '');
  assert.strictEqual(edit(s, file('c.js')), '');
  assert.strictEqual(edit(s, exclude, { tool_name: 'Write' }), '');
  assertDenied(edit(s, file('d.js')));
});

// Config dir outside tmpdir, so only the off-flag rule can deny it.
const home = nodePath.join(repo, 'home', '.claude');
const offReason = (s) => {
  const o = JSON.parse(edit(s, nodePath.join(home, '.goat-off'), { tool_name: 'Write' }, home)).hookSpecificOutput;
  assert.strictEqual(o.permissionDecision, 'deny');
  return o.permissionDecisionReason;
};

test('the off flag file is denied to the lead before any file and not counted, other config files still pass', () => {
  const s = sid();
  assert.match(offReason(s), /only the user/);
  assert.strictEqual(edit(s, nodePath.join(home, 'projects', 'p', 'memory', 'm.md'), { tool_name: 'Write' }, home), '');
  assert.deepStrictEqual(fill(s, home), ['', '', '']);
});

test('the off flag file is denied after 3 files with the user-only reason, not the builder one', () => {
  const s = sid();
  fill(s, home);
  const reason = offReason(s);
  assert.match(reason, /only the user/);
  assert.doesNotMatch(reason, /brief a builder/);
});

test('a subagent is denied the off flag file, like the lead', () => {
  assert.match(JSON.parse(edit(sid(), nodePath.join(home, '.goat-off'), { tool_name: 'Write', agent_id: 'a1' }, home)).hookSpecificOutput.permissionDecisionReason, /only the user/);
});

test('subagent writes of normal files stay allowed and create no state file', () => {
  const s = sid();
  for (const f of ['p.js', 'q.js', 'r.js', 's.js', 't.js']) assert.strictEqual(edit(s, file(f), { agent_id: 'a1' }), '');
  assert.ok(!fs.existsSync(nodePath.join(os.tmpdir(), `goat-delegate-${s}`)));
});

const shell = (command, tool_name = 'Bash', extra = {}) => { const s = sid(); sessions.push(s); return { s, out: run({ session_id: s, tool_name, tool_input: { command }, ...extra }, home) }; };
const denyUserOnly = (out) => assert.match(JSON.parse(out).hookSpecificOutput.permissionDecisionReason, /only the user/);

test('Bash writing the off flag is denied for the lead', () => denyUserOnly(shell('echo x > ~/.goat-off').out));
test('PowerShell writing the off flag is denied', () => denyUserOnly(shell('New-Item $HOME\\.GOAT-OFF', 'PowerShell').out));
test('a subagent Bash command with the off flag is denied', () => denyUserOnly(shell('touch ~/.goat-off', 'Bash', { agent_id: 'a1' }).out));

test('other shell commands print nothing and create no state file', () => {
  const r = shell('npm test');
  assert.strictEqual(r.out, '');
  assert.ok(!fs.existsSync(nodePath.join(os.tmpdir(), `goat-delegate-${r.s}`)));
});

test('the toggle command text stays allowed', () => {
  assert.strictEqual(shell('node "${CLAUDE_PLUGIN_ROOT}/scripts/goat-off.js"').out, '');
  assert.strictEqual(shell('node "${CLAUDE_PLUGIN_ROOT}/scripts/goat-on.js"').out, '');
});

const runAsync = (input) => new Promise((resolve) => {
  const c = spawn(process.execPath, [script], { env: { ...process.env, GOAT_HOME: dir, GOAT_CONFIG_DIRS: dir } });
  let out = '';
  c.stdout.on('data', (d) => { out += d; });
  c.on('close', () => resolve(out));
  c.stdin.end(JSON.stringify(input));
});

test('8 parallel hooks in one session: exactly 3 allowed and 5 denied, 20 times', async () => {
  let bad = 0;
  for (let i = 0; i < 20; i++) {
    const s = sid();
    sessions.push(s);
    const outs = await Promise.all(Array.from({ length: 8 }, (_, k) => runAsync({ session_id: s, tool_name: 'Edit', tool_input: { file_path: file(`f${k}.js`) } })));
    if (outs.filter((o) => o === '').length !== 3 || outs.filter((o) => o.includes('"deny"')).length !== 5) bad++;
  }
  assert.strictEqual(bad, 0);
});
