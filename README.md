# goat-iterate

Lead + builder + critic loop for AI coding agents, packaged as an Agent Plugins v1 plugin. Builders make the deliverable, a fresh critic judges each round, the lead keeps best-so-far. The bar is set before anything is built; only the critic moves it.

Works with any agent tool that supports the Agent Plugins specification and can spawn subagents.

## Why

Solo building drifts: you write the spec, build the thing, and grade your own homework. goat-iterate splits the roles so the judge never wrote the code it scores:

- **Lead** (your main agent) keeps the bar, dispatches builders, owns best-so-far.
- **Builders** (worker subagents) produce the deliverable with per-line evidence.
- **Critic** (fresh subagent each round) judges from evidence, scores aspects 1-10, rejects like a professional reviewer.

## How a loop runs

1. **Round 0 - the bar.** Lead writes `spec.md` (what "done" means, observable) and `eye.md` (how the real output is observed). Critic setup mode writes `rubric.md` (5-8 aspects, top-professional descriptors) and `checklist.md` (15-30 pass/fail lines with numbers).
2. **Round 1 - full build.** Every checklist line built in one round, complete first version, parallel builders.
3. **Rounds 2..N - judge / keep / batch.** Fresh critic each round: PASS/FAIL/UNSEEN per line with evidence, aspect scores vs best-so-far, at most 3 professional rejections. Lead keeps what passed, batches every FAIL + new line into the next build round.
4. **Stop.** Bar met (>=90% PASS, every aspect >=8, no open rejection), plateau, or budget (4 judged rounds default). Every stop without the bar met writes `BAR NOT MET` at the top of the report. The word "done" appears only when the bar is met.

## Install

Install with your agent's plugin install command. For Hermes Agent:

```
hermes plugins install 1Rizqi/goat-iterate
hermes plugins enable goat-iterate
```

For Claude Code, Codex, Gemini CLI, OpenCode, Copilot CLI, and most other agents that support the Agent Plugins specification, the same command works (or point your agent to https://github.com/1Rizqi/goat-iterate). The skill loads as `goat-iterate:goat-iterate`.

## Use

Tell your agent to run the loop on a task - "use goat-iterate for this". The loop folder `.iterate/<slug>/` holds spec, rubric, checklist, per-round verdicts, evidence, and `state.md` (loop memory - a new chat resumes from it).

## Repo layout

```
plugin.json                                 Agent Plugins v1.0.0 manifest
skills/goat-iterate/SKILL.md                the skill: decision path, lead rules, delegation, rounds, stop conditions
skills/goat-iterate/references/eye.md       eye table by deliverable type (evidence beats source)
skills/goat-iterate/references/rounds.md    round-by-round detail incl. amend
skills/goat-iterate/references/spec-template.md
skills/goat-iterate/references/subagent.md  builder/critic rules for dispatch briefs
```

## License

MIT
