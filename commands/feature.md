---
name: logbook:feature
description: Add or update a feature/task in the tracking file
user_invocable: true
args: "[add|update|list] [details]"
---

Manage features and tasks in the logbook tracking file.

## Subcommands

### `add <title>` — Add a new feature/task
1. Read config from `.claude/logbook.local.md` (default: `.claude/system/`)
2. Read the features file
3. Generate next ID using the configured prefix and next sequential number
4. Ask the user for:
   - Priority (1 = highest, default to next available)
   - Dependencies (other feature IDs, default none)
5. Create the entry:
   ```json
   {
     "id": "F001",
     "title": "User-provided title",
     "status": "new",
     "priority": 1,
     "dependencies": [],
     "notes": ["Created YYYY-MM-DD"]
   }
   ```
6. Write back the features file
7. Log to history: `[YYYY-MM-DD HH:MM] NOTE: Created feature F001: title`

### `update <id> <status>` — Update a feature's status
1. Read the features file
2. Find the feature by ID
3. Update its status (validate: new, in_progress, complete, blocked)
4. Add a timestamped note about the status change
5. Write back and log to history

### `list` — List all features (same as `/logbook:status` features section)
1. Read and display features grouped by status

### No arguments
If `$ARGUMENTS` is empty, show usage help and list current features.
