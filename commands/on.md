---
description: Turn the rules and the delegate guard back on
allowed-tools: Bash(node:*)
disable-model-invocation: true
---
!`node "${CLAUDE_PLUGIN_ROOT:-.}/scripts/goat-on.js"`

goat-iterate is ON. Follow the rules printed above from now on; any earlier "goat-iterate is OFF" note no longer applies, and subagents started from now on get the builder and critic rules again.

Reply with one line in the user's language confirming the rules and the delegate guard are back on.
