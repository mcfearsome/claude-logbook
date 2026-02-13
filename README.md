# claude-logbook

Session lifecycle management and work tracking for [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

Logbook gives Claude persistent memory across sessions. It automates session start/end protocols, maintains structured tracking files, and ensures continuity when context resets.

## Install

### From the marketplace

```bash
claude plugin marketplace add https://github.com/mcfearsome/cc-marketplace
```

### Manual

Clone the repo and add it to your `~/.claude/settings.json`:

```json
{
  "plugins": [
    { "path": "/path/to/claude-logbook" }
  ]
}
```

### Getting started

Once installed, initialize in any project:

```
/logbook:init
```

New to logbook? Run `/logbook:walkthrough` for a guided tour.

## What it does

### Hooks (automatic)

| Hook | Event | Behavior |
|------|-------|----------|
| **Session start** | `SessionStart` | Reads git status + tracking files, identifies current focus, announces plan |
| **Session end** | `Stop` | Reminds to commit, update features, log history |
| **Plan sync** | `PostToolUse:ExitPlanMode` | Writes approved plan tasks into features.json |
| **Track reminder** | `UserPromptSubmit` | Gentle nudge to log progress periodically |

### Commands

| Command | Description |
|---------|-------------|
| `/logbook:init [paths...]` | Initialize tracking files in one or more projects |
| `/logbook:status` | Show current project status from tracking files |
| `/logbook:track <action> <desc>` | Log a work entry to history |
| `/logbook:feature add\|update\|list` | Manage features and tasks |
| `/logbook:rule <text>` | Add a project constraint or discovery |
| `/logbook:backlog [from <file>]` | Interactive backlog building or import |
| `/logbook:roadmap [port]` | Live roadmap dashboard in the browser |
| `/logbook:workspace init\|status\|add\|remove` | Multi-project workspace management |
| `/logbook:walkthrough` | Guided tour of logbook features and commands |
| `/logbook:end` | Manually trigger session end protocol |

## Tracking files

Logbook maintains three files per project (default: `.claude/system/`):

### features.json

```json
[
  {
    "id": "F001",
    "title": "Add user authentication",
    "status": "in_progress",
    "priority": 1,
    "dependencies": [],
    "notes": ["2025-01-15: Started implementation"]
  }
]
```

Statuses: `new` → `in_progress` → `complete`, or `blocked` at any point.

### history.txt

```
[2025-01-15 14:30] START: Beginning work on F001 (Authentication)
[2025-01-15 15:30] DECISION: Using JWT with refresh tokens
[2025-01-15 17:00] COMPLETE: F001 done, 23 tests passing
```

Actions: `START`, `PROGRESS`, `DECISION`, `BUG`, `FIX`, `COMPLETE`, `BLOCKED`, `NOTE`

### rules.txt

```
1. All API endpoints must validate auth token before processing
2. Refresh tokens expire after 7 days, not configurable
3. Password hashing uses bcrypt with cost factor 12
```

Append-only. Rules accumulate as you discover constraints.

## Configuration

Per-project config lives at `.claude/logbook.local.md`:

```yaml
---
tracking_dir: .claude/system
features_file: features.json
history_file: history.txt
rules_file: rules.txt
id_prefix: F
---
```

## Multi-project workspaces

For projects spanning multiple repos, logbook supports workspaces that aggregate tracking across projects.

### Setup

From a parent directory:

```
# Initialize all projects at once
/logbook:init project-api project-web project-mobile

# Create the workspace
cd project-hub
/logbook:workspace init
```

### Workspace config

```yaml
---
tracking_dir: .
features_file: features.json
id_prefix: W
projects:
  project-api:
    path: ../project-api
  project-web:
    path: ../project-web
  project-mobile:
    path: ../project-mobile
---
```

### Cross-project dependencies

Features can reference dependencies in other projects:

```json
{
  "id": "W001",
  "title": "E2E: API auth → Web login → Mobile SSO",
  "dependencies": ["project-api:F012", "project-web:F003"]
}
```

### Unified dashboard

`/logbook:roadmap` in a workspace shows all projects in one view with per-project stats and filter buttons.

## Roadmap dashboard

`/logbook:roadmap` starts a local Node.js server with a live-updating dashboard:

- Dark theme with status cards, progress bar, and feature table
- Auto-refreshes when tracking files change
- Per-project filtering in workspace mode
- `/api/features` endpoint for raw JSON

Requires Node.js.

## How it works

Logbook is entirely prompt-based. The hooks inject instructions into Claude's context at session boundaries. Claude reads the tracking files, reasons about what to work on, and maintains the files as it works. There's no magic — just structured instructions and a consistent file format.

The session-tracker agent handles bulk operations (backlog creation, batch status updates) when the mechanical work would be tedious in the main conversation.

## Plugin structure

```
claude-logbook/
├── plugin.json
├── hooks/
│   ├── session-start.md         # SessionStart prompt
│   ├── session-end.md           # Stop prompt
│   ├── plan-to-backlog.md       # PostToolUse:ExitPlanMode prompt
│   └── track-reminders.md       # UserPromptSubmit prompt
├── commands/
│   ├── init.md                  # /logbook:init
│   ├── status.md                # /logbook:status
│   ├── track.md                 # /logbook:track
│   ├── feature.md               # /logbook:feature
│   ├── rule.md                  # /logbook:rule
│   ├── backlog.md               # /logbook:backlog
│   ├── roadmap.md               # /logbook:roadmap
│   ├── workspace.md             # /logbook:workspace
│   ├── walkthrough.md            # /logbook:walkthrough
│   └── session-end.md           # /logbook:end
├── agents/
│   └── session-tracker.md       # Bulk tracking operations
├── skills/
│   └── tracking-format.md       # File format reference
└── server/
    └── roadmap-server.mjs       # Live dashboard server
```
