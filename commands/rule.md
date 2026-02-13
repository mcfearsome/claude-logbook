---
name: logbook:rule
description: Add a new rule to the rules tracking file
user_invocable: true
args: "<rule description>"
---

Add a new numbered rule to the rules tracking file. Rules capture important constraints, patterns, and discoveries about the project.

## Steps

1. Read config from `.claude/logbook.local.md` (default: `.claude/system/`)

2. Read the rules file to find the current highest rule number.

3. If `$ARGUMENTS` is provided, use it as the rule text. Otherwise, ask the user what rule to add.

4. Append the new rule with the next sequential number:
   ```
   N. Rule description here
   ```

5. Log to history: `[YYYY-MM-DD HH:MM] DECISION: Added rule N: description`

6. Confirm: "Added rule #N: description"
