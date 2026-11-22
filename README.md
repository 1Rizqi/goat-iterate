# goat-iterate

Lead + builder + critic loop for [Hermes Agent](https://hermes-agent.nousresearch.com). Builders make the deliverable, a fresh critic judges each round, the lead keeps best-so-far. The bar is set before anything is built; only the critic moves it.

Port of the goat Claude plugin to Hermes Agent.

## Why

Solo building drifts: you write the spec, build the thing, and grade your own homework. goat-iterate splits the roles so the judge never wrote the code it scores:

- **Lead** (your main agent) keeps the bar, dispatches builders, owns best-so-far.
- **Builders** (Hermes `builder` profile) produce the deliverable with per-line evidence.
- **Critic** (fresh subagent each round) judges from evidence, scores aspects 1-10, rejects like a professional reviewer.

## How a loop runs

1. **Round 0 - the bar.** Lead writes `spec.md` (what "done" means, observable) and `eye.md` (how the real output is observed). Critic setup mode writes `rubric.md` (5-8 aspects, top-professional descriptors) and `checklist.md` (15-30 pass/fail lines with numbers).
2. **Round 1 - full build.** Every checklist line built in one round, complete first version, parallel builders.
3. **Rounds 2..N - judge / keep / batch.** Fresh critic each round: PASS/FAIL/UNSEEN per line with evidence, aspect scores vs best-so-far, at most 3 professional rejections. Lead keeps what passed, batches every FAIL + new line into the next build round.
4. **Stop.** Bar met (>=90% PASS, every aspect >=8, no open rejection), plateau, or budget (4 judged rounds default). Every stop without the bar met writes `BAR NOT MET` at the top of the report. The word "done" appears only when the bar is met.

## Install

Copy the skill into your Hermes skills directory:

```
cp -r goat-iterate ~/.hermes/skills/goat-iterate
```

(Windows: `%LOCALAPPDATA%\hermes\skills\goat-iterate`.)

## Use

Tell your agent to run the loop on a task - "use goat-iterate for this". The loop folder `.iterate/<slug>/` holds spec, rubric, checklist, per-round verdicts, evidence, and `state.md` (loop memory - a new chat resumes from it).

## Repo layout

```
SKILL.md              the skill: decision path, lead rules, rounds, stop conditions
references/eye.md     eye table by deliverable type (evidence beats source)
references/rounds.md  round-by-round detail incl. amend
references/spec-template.md
references/subagent.md  builder/critic rules for dispatch briefs
```

## License

MIT
