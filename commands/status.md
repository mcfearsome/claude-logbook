---
name: logbook:status
description: Show current project status from tracking files
user_invocable: true
---

Show the current project status by reading all logbook tracking files.

## Steps

1. Read `.claude/logbook.local.md` to find tracking file locations. If it doesn't exist, check default location `.claude/system/`. If no tracking files exist anywhere, tell the user to run `/logbook:init` first.

2. Read and summarize:

### Features/Tasks
- Read the features file and display a summary table:
  - Total features by status (new, in_progress, complete, blocked)
  - List any `in_progress` items with their notes
  - List any `blocked` items with their blocker descriptions
  - Show the next actionable item (highest priority `new` with satisfied dependencies)

### Recent History
- Read the last 20 lines of the history file
- Display them formatted

### Rules Count
- Count total rules in the rules file
- Show the last 3 rules added

3. End with a one-line summary: "X features tracked, Y in progress, Z blocked. Last activity: [last history entry]"
