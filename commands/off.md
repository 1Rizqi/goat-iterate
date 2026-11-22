---
description: Turn the rules and the delegate guard off, until /goat-iterate:on
allowed-tools: Bash(node:*)
disable-model-invocation: true
---
!`node "${CLAUDE_PLUGIN_ROOT:-.}/scripts/goat-off.js"`

goat-iterate is OFF. For the rest of this session, set aside the goat-iterate rules and subagent rules injected earlier and work your default way; subagents started from now on get no goat-iterate rules. Start the loop only when the user asks for it.

Reply with one line in the user's language confirming goat-iterate is off, and note that it stays off until /goat-iterate:on is invoked.
