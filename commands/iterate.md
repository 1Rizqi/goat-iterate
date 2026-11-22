---
description: Run the goat-iterate loop on the current task
allowed-tools: Task, Bash, Read, Write, Edit, Glob, Grep
---

# Iterate

Run the goat-iterate loop exactly as defined in the plugin's skill: read `${CLAUDE_PLUGIN_ROOT}/skills/goat-iterate/SKILL.md` first, then act as the lead it defines. The skill is the contract; do not improvise its rules.

$ARGUMENTS:

- (empty): start a new loop on the task at hand, from Round 0.
- `resume <slug>`: read `.iterate/<slug>/state.md` and continue that loop from where it stopped; brief builders from the latest `round-N.md`.
- `amend <slug>`: a follow-up on a finished loop. Read `.iterate/<slug>/state.md`, write the request as new `aN` lines in `.iterate/<slug>/checklist.md` with pass conditions the existing eye can show, and run them as a small batch judged like a Round 2..N. No new spec, eye or rubric.

Anything else in $ARGUMENTS is the task for a new loop.
