---
name: goat-iterate
description: Use for build-critique loops with builder and critic agents.
version: 0.6.0
author: Riz
license: MIT
metadata:
  tags: [goat, iterate, builder, critic, quality-loop, delegation]
  related_skills: [code-review, tdd, qa-evidence]
---

# GOAT iterate (lead + builder + critic)

You are the lead. Builders make the deliverable; a fresh critic runs the eye and judges each round; you keep best-so-far. The bar is set before anything is built; only the critic moves it.

## When to Use (decision path)
1. Small fix (≤3 files, ≤60 lines, places known): do it yourself, run its test.
2. Step-by-step work the user reviews as it lands (UI/copy tweaks from an approved mockup): user is the judge. No loop, no critic.
3. Loop (user invoked the plugin, or new module / rebuild / architecture change): this skill.
4. Anything else: builders + done command + eye + code-review before commit; offer the loop in one line.
A follow-up on a deliverable with `.iterate/<slug>/` is an **amend** (references/rounds.md), never a new loop.

## Lean lead
- One task = one chat; when done or corrected twice on one thing, suggest starting a fresh chat.
- Loop folder `.iterate/<slug>/` (add to .git/info/exclude): `spec.md`, `eye.md`, `rubric.md`, `checklist.md`, `round-N.md`, `metrics.md`, `eye/round-N/`, `state.md`, `summary.md`. `state.md` = loop memory (round, best-so-far commit, per-area scope lists, load table, open global change). New chat resumes from it, never mid-loop compaction.
- You edit no deliverable file inside the loop — every change goes through a builder (low model tier for mechanical lines). Git: the builder commits its code deliverable (user role split assigns all technical work, git included, to the builder); the lead never edits deliverable files directly and only steers via dispatch prompts. Branch `iterate/<slug>` unless the project is single-branch; a kept round commits with its score line.
- Agents write full output to the loop folder; builders save per-line evidence (test output, screenshot, frame, diff, log) under `eye/round-N/builder-<area>/` — a line without evidence is not done. Hand pointers ("area `api` in checklist.md"), never pasted lists.

## Delegation
Split by role, not by task — builders are background worker subagents of your agent tool, only the critic is a fresh subagent with clean context:
- **Builders = worker subagents** (cheapest model tier that can do the job). Write the prompt to `<repo>/evidence/prompt_builder_<tag>.txt`, leading with `PLAN APPROVED BY OWNER. DO NOT ASK QUESTIONS OR WAIT FOR CONFIRMATION. EXECUTE IMMEDIATELY. RUN TESTS AND COMMIT.` (builders otherwise stall in plan-approval). Dispatch in background, never foreground (tool caps kill the run mid-task). The deliverable is the evidence file the prompt names, never the CLI stdout. Builder brief: goal, scope list (files to touch / not touch), entry points file:line, rules/decisions it needs, done command, evidence folder `eye/round-N/builder-<area>/`, reply shape (≤15 lines: done N/M with evidence paths, files changed file:line, done command result, `load: light|right|heavy`, doubts).
- **Critic = fresh subagent** (clean context each judging round, strongest available model): setup mode (rubric+checklist) or judge mode; paths of spec/eye/rubric/checklist/evidence folders, files changed since best-so-far, round cost, no earlier scores. Never builds. Judge from evidence (its own eye runs); builder evidence is a claim to verify.
- Subagent rules (references/subagent.md) apply to BOTH briefs: scope discipline, fix root cause at every place it reaches, read big files in slices, return summaries not file contents.

## Model ladder (cheapest that can do the job)
low tier (exact file:line + target value, renames, fixtures, grep sweeps) → medium tier (builder default, most local fixes) → medium-high → high → top tier (cross-file root cause, a line failed under high). The critic stays on the strongest available. Load per brief: top ≤25 lines/15 files, medium ≤12/8, low ≤6/4. All PASS + green: next load ×1.5; half or fewer PASS / red / stopped short: halve. A line still FAIL, or an area with regressions/new problems: brief once more one step up, never a third time on the same step; failed low-tier enters at medium. A line failing at the top of the ladder is an approach problem — change the approach, not the model.

## Rounds
- **Round 0 (bar):** spec.md (draft from references/spec-template.md if none; wrong spec wastes every round — user yes once), eye.md (references/eye.md — how the real output is observed), critic setup mode writes rubric.md (5–8 aspects, observable 1–3 and 8–10 descriptors at top-professional level) + checklist.md (15–30 lines: `ID | area | what, with numbers | pass condition visible through the eye`).
- **Round 1 (full build):** every line built in one round, complete first version, end states not actions, parallel builders.
- **Rounds 2..N (judge/keep/batch):** fresh critic each round → round-N.md (PASS/FAIL/UNSEEN per line with evidence, aspect scores pairwise vs best-so-far, ≤3 professional rejections, ≤15 new checklist lines for aspects <9, FAIL groups tagged local/global) + metrics.md. Keep-or-revert per area (git stash the regressing area's files). Batch = every FAIL+UNSEEN+new line at once, grouped by root cause; a global change rides the same batch first; only a second global change waits a round. Last mile: no regression, no open rejection, all aspects ≥8, all open groups local → builders fix, eye re-runs on each fixed line, lead opens the diff; only then commit and stop.

## Stop
- **Bar met:** ≥90% PASS, every aspect ≥8, no open professional rejection (last round; after last mile also every fixed line PASS on re-eye). Amend: all aN lines PASS, no regression.
- **Plateau:** two judged rounds with nothing better, after one approach change tried.
- **Budget:** 4 judged rounds default (spec may raise; amend budget 2).
- Every stop without bar met writes `BAR NOT MET` as line 1 of summary.md and the chat report. The words "done/selesai" appear only when the bar is met.
- Report at stop: score table from metrics.md, final load table, what fails and why, next batch if continued, path of summary.md; suggest a fresh chat; later follow-up = amend.

Mechanical checks ("is every use gone?", gates pass?) are grep/tests/code-review, never a critic. Ask the user mid-loop only for irreversible actions or contract changes.

## References
- references/eye.md — eye table by deliverable type (evidence beats source).
- references/spec-template.md — SPEC draft template.
- references/rounds.md — round-by-round detail incl. amend.
- references/subagent.md — builder/critic rules to paste into dispatch briefs.
