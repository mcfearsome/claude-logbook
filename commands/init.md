---
name: logbook:init
description: Initialize logbook tracking files in one or more projects
user_invocable: true
args: "[paths...]"
---

Initialize the logbook tracking system for one or more projects.

## Modes

### Single project (no arguments, or single path)

If no arguments are given, initialize the current directory. If a single path is given, initialize that directory.

1. Check if `<target>/.claude/logbook.local.md` already exists. If it does, read it and report the current configuration. Ask if the user wants to reinitialize.

2. Ask the user where they'd like tracking files stored. Default: `.claude/system/`

3. Create the tracking directory if it doesn't exist.

4. Create initial tracking files:

#### features.json
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

#### history.txt
```
[YYYY-MM-DD HH:MM] INIT: Logbook initialized for project
```

#### rules.txt
```
# Project Rules and Constraints
# Append-only — never delete entries, only add new ones

1. (Add rules as you discover them)
```

5. Create `<target>/.claude/logbook.local.md` with the configuration:

```yaml
---
tracking_dir: .claude/system
features_file: features.json
history_file: history.txt
rules_file: rules.txt
id_prefix: F
---
```

6. Confirm initialization is complete and show the user what was created.

7. Suggest next steps: "Run `/logbook:walkthrough` for a guided tour of what logbook can do, or `/logbook:backlog` to start building your feature list."

### Batch mode (multiple paths or glob)

If multiple paths are given (e.g., `/logbook:init colony-shell colony-cloud colony-terminal`), initialize each one:

1. Resolve each path relative to the current working directory.

2. Show the list of projects that will be initialized and which already have logbooks. Ask the user to confirm.

3. For each project, ask the user for an ID prefix. Suggest a prefix derived from the project name:
   - `colony-shell` → `S`
   - `colony-cloud` → `C`
   - `colony-terminal` → `T`
   - `colony-social` → `SO`
   - `colony-web` → `W`
   Or the user can accept a default (all use `F`).

4. Initialize each project with the chosen prefix, using default tracking directory `.claude/system/` for all (unless the user specifies otherwise).

5. Display a summary table showing what was initialized.

### Wildcard mode

If the argument is a glob pattern (e.g., `/logbook:init colony-*`), expand it against the current directory and treat the matches as batch mode.
