---
name: logbook:init
description: Initialize logbook tracking files in the current project
user_invocable: true
---

Initialize the logbook tracking system for this project.

## Steps

1. Check if `.claude/logbook.local.md` already exists. If it does, read it and report the current configuration. Ask if the user wants to reinitialize.

2. Ask the user where they'd like tracking files stored. Default: `.claude/system/`

3. Create the tracking directory if it doesn't exist.

4. Create initial tracking files:

### features.json
```json
[]
```
An empty array ready for feature/task entries. Each entry follows this schema:
```json
{
  "id": "F001",
  "title": "Feature title",
  "status": "new",
  "priority": 1,
  "dependencies": [],
  "notes": []
}
```
Valid statuses: `new`, `in_progress`, `complete`, `blocked`

### history.txt
```
[YYYY-MM-DD HH:MM] INIT: Logbook initialized for project
```

### rules.txt
```
# Project Rules and Constraints
# Append-only — never delete entries, only add new ones

1. (Add rules as you discover them)
```

5. Create `.claude/logbook.local.md` with the configuration:

```yaml
---
tracking_dir: .claude/system
features_file: features.json
history_file: history.txt
rules_file: rules.txt
id_prefix: F
---

# Logbook Configuration

Tracking files are stored in `{{ tracking_dir }}`.
```

6. Confirm initialization is complete and show the user what was created.
