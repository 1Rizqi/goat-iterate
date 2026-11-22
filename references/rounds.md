# Rounds in detail

## Round 0: set the bar
1. **Spec.** A SPEC from the user goes to `spec.md` as is. A one-line goal gets drafted into `spec.md` from references/spec-template.md, with real numbers from the code or material it touches. A drafted spec goes to the user once for a yes before step 2: a wrong spec wastes every round after it.
2. **Eye.** Choose how the real output will be observed and write it to `eye.md`, using references/eye.md. When nothing fits, have a builder make the tool first.
3. **Bar.** Brief the critic in setup mode with `spec.md` and `eye.md`. It runs the eye once on the current state (a stub when nothing exists yet) into `eye/round-0/`, then writes `rubric.md` (5–8 aspects, each with observable 1–3 and 8–10 descriptors at the level a top professional in this field would sign) and `checklist.md` (`ID | area | what, with numbers | pass condition visible through the eye`; one line per observable requirement, usually 15–30, never padded). Done when the eye ran end to end and every checklist line names a pass condition the eye can show.

## Round 1: full build
Brief builders per load with the brief fields from references/subagent.md, its scope list, a pointer to its checklist lines, its evidence folder `eye/round-2/builder-<area>/`, and:
- each line as an end state the eye can show ("whole lighthouse and beam visible, 8% top margin"), never an action ("camera 20% closer");
- things that must agree (beam and its light spot, summary and table, function and callers) derived one from the other, written once.

Builders run in parallel. Every line gets built in this round: a complete first version, not a rough one to polish later. Done when every builder reports all its lines built, each with its evidence path, and its done command green; a line without evidence counts as not built.

## Rounds 2..N: judge, keep, batch
1. **Critic.** A fresh critic each round, briefed with the paths of spec, eye, rubric, checklist, this round's evidence folder `eye/round-N/` (builder evidence included), the best-so-far round's evidence folder, the files changed since best-so-far (`git diff --name-only <best>`), the round's build cost (tokens and minutes per builder, from the delegate results), and no earlier scores. It runs every eye that fits the deliverable on the working tree and writes `round-N.md`:
   - PASS / FAIL / UNSEEN for every line that was not PASS at best-so-far and every line whose area has changed files; the rest carry over as `PASS (carried)`. Each verdict points to one evidence file under `eye/round-N/` with its location; a verdict without one is UNSEEN, and UNSEEN counts as absent;
   - every rubric aspect scored with evidence, and pairwise per aspect: better / same / worse than best-so-far;
   - up to 3 reasons a top professional would still reject it: a defect they would refuse to sign (wrong result, unsafe, broken contract, a requirement unmet), never polish; none when they would sign it;
   - new lines for every gap that holds an aspect under 9, including what the spec leaves out but a top professional would demand: at most 15 per round, in every round. Appended to `checklist.md`, tagged by area and `rN`;
   - FAIL and UNSEEN lines grouped by root cause, each group marked `local` (one place, exact file:line and target) or `global`.

   Last, with `round-N.md` final, it appends the round to `metrics.md`: % PASS, each aspect's score with its trend against best-so-far, the level word, the round cost, and a "testable next" list of commands or steps anyone can run.
2. **Keep or revert, per area.** A regression is an aspect worse pairwise or down 2+ points against best-so-far's `round-K.md`, or a line that passed at best-so-far now failing. Find the area whose files caused it: `git stash push -u -m round-N-<area> -- <its files>`, tell that builder its files are back at best-so-far, and write the cause in `round-N.md`; that area changes approach instead of tuning numbers. Commit the rest with the score line; that commit is the new best-so-far. Revert the whole round only when the cause spans areas.
3. **Last mile or another round.** No regression, no open professional rejection, every aspect ≥ 8 in this `round-N.md` and every open group `local`: this batch is the last mile. Builders fix it with evidence per line and the last-mile done command green; then the eye runs again on each fixed line into `eye/round-N/last-mile/` (you run a command eye; a fresh critic runs any eye you would have to look at), and you open the diff yourself. It counts as bar met only when that eye run shows every fixed line PASS and every other line is PASS or carried: commit and stop. Otherwise it stays uncommitted as this round's batch (step 4) and the next round judges it.
4. **Batch: everything at once.** Every FAIL + UNSEEN + new line goes in this round's batch, grouped by root cause so each cause is fixed once at every place it reaches, and packed into briefs by the load table and the escalation ladder. A global change rides in the same batch: its builder applies it first, then the local lines. Only a second global change waits for the next round.
5. Update `state.md`.

Local = touches one part (a function, paragraph, component, slide, column). Global = moves everything (architecture, data schema, document structure, tone, visual theme, camera, lighting).

## Amend
`/goat-iterate amend <slug>`, or a follow-up request on a deliverable that has `.iterate/<slug>/`:
1. Read `state.md` only; check out `iterate/<slug>` at best-so-far.
2. Write the request into `checklist.md` as new lines tagged `aN`, with pass conditions the existing eye can show. Extend the scope lists the lines need.
3. Pack the `aN` lines into briefs by the load table (usually sonnet or haiku): reuse a live builder when its model fits, otherwise a fresh builder briefed with `state.md`, its scope list and the `aN` lines.
4. Judge as in Rounds 2..N: the critic checks the `aN` lines and the carried lines of touched areas, then last mile or another round as there. No new spec, eye or rubric. Amend rounds count against the amend's own budget (2 judged rounds), never the loop's spent one.

## Mid-loop conduct
Ask the user only for irreversible actions or a contract change (a characterization test that would need new expected values). At stop, check out best-so-far, write `summary.md` (score table per round from `metrics.md`, the final load table, what still fails and why, the next batch if continued), and report: line 1 is `BAR NOT MET` or the bar-met statement, then one line per spec "Must have" item (PASS/FAIL + evidence path), then the path of `summary.md`; everything else fits in 5 more lines. Ask the user to check the result; a "not yet" or a correction becomes `aN` lines and runs as an amend in the same loop, never a new loop. Merging the branch is the user's call.
