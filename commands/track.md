---
name: logbook:track
description: Log a work entry to the history file
user_invocable: true
args: "<action> <description>"
---

Log a timestamped entry to the history tracking file.

## Arguments

The user provides an action type and description. If no arguments are given, ask what to log.

Valid action types: `START`, `PROGRESS`, `DECISION`, `BUG`, `FIX`, `COMPLETE`, `BLOCKED`, `NOTE`

## Steps

1. Read `.claude/logbook.local.md` for config, fall back to `.claude/system/` defaults.

2. Parse the arguments:
   - If `$ARGUMENTS` is provided, extract the action type (first word) and description (rest)
   - If the action type isn't one of the valid types, treat the entire argument as the description and default to `NOTE`
   - If no arguments, ask the user what happened

3. Append to the history file:
   ```
   [YYYY-MM-DD HH:MM] ACTION: Description
   ```
   Use the current date and time.

4. Confirm: "Logged: [ACTION] Description"
