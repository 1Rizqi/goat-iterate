GOAT MODE ACTIVE (only the user switches it off, with goat-off)

# Lean context
- One task = one chat. When a task is done, or the user has corrected you twice on the same thing, suggest starting a new chat.
- Your window holds decisions and summaries. Find code with the repo's index first (the repo's decision log if installed);
  reading beyond a few files goes to a read-only subagent on the low tier; long logs and test
  output go to a low-tier subagent that returns the failing lines. Work from the summary.
- Decisions that must outlive the chat: repo decisions -> the repo's decision log if installed,
  user preferences -> your agent's memory feature. One line: what + why.
- Long work keeps its progress in a file (iterate's `state.md`); resume in a new chat from it rather than compacting.

# Delegation
- You are the lead: locate, plan, brief, verify. Subagents read and build; pick the agent whose description fits the area.
- Every brief, in technical English: goal, scope (files to touch / not to touch), entry points (file:line),
  the rules and decisions it needs (subagents don't see your memory files), skills to invoke and when, done command.
- Inside an iterate loop you commit each kept round on its branch; outside it, commit when the user asks.
  Subagents keep git read-only.
- The iterate skill, typed by the user, always runs the loop. Otherwise pick the path by who judges the result, first match wins:
  1. Small fix (places known, at most 3 files and 60 changed lines): make it yourself, then run its test.
     More than 3 files go through a builder agent. The goat delegate hook denies the 4th distinct deliverable file you
     edit yourself in a chat (the loop folder, `.git/`, the agent config dir and temp files do not count).
  2. Step by step with the user (UI, copy or layout tweaks, steps from a mockup the user approved; the user looks at
     each step as it lands): the user is the judge. Builders per step, you check each with the done command and the
     eye (screenshot, grep), `code-review` before a commit that touches logic. No loop, no critic.
  3. Loop: the iterate skill when the user asks for it, or on your own when the change builds a new module,
     a rebuild or an architecture change.
  4. Anything else (bigger than a small fix, not 2 or 3: removals, renames, a feature in existing modules, new tests):
     builders, then the done command, the eye and `code-review` before the commit; offer the loop in one line.
  A follow-up on a deliverable with `.iterate/<slug>/` is `amend <slug>`, never a new loop.
- The critic agent runs only inside a loop. A mechanical check ("is every use gone?", "do the gates pass?") is grep,
  the tests and `code-review`, never a critic.
- When a loop stops or a task is done, suggest a new chat before the next task; never start a second loop in the same chat.
- Builders are builder agents (clean context); a project lane agent only where the project defines one,
  general-purpose only when the work needs a skill.
- Model ladder, cheapest that can do the job: low tier for mechanical work (an exact file:line and target value,
  renames, fixtures, grep sweeps, log triage, rerunning a done command); medium tier (the builder's default) for
  building; top tier only when the brief names why (cross-file root cause, a line that failed under high).
  Steps up: medium -> medium-high -> high -> top (failed low-tier work enters at medium).
  A done command still red after the builder's own retry (in a loop also a line still FAIL from the last round,
  or an area that raised new problems): brief once more one step up, never a third time on the same step.
  The critic stays on the top tier. Pass `model`/`effort` only to move a builder off its default (medium), up the
  ladder or down to low tier; in a loop, record model and effort in the load table.

# Compact instructions
Preserve: current task, `.iterate/<slug>/` path and round, best-so-far commit, files changed,
last test or eye result, every decision with its reason, each agent's id.
