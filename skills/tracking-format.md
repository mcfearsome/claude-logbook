---
name: logbook:format-guide
description: Reference guide for logbook tracking file formats and conventions
---

# Logbook Tracking File Formats

## Configuration

Per-project config lives at `.claude/logbook.local.md` with YAML frontmatter:

```yaml
---
tracking_dir: .claude/system
features_file: features.json
history_file: history.txt
rules_file: rules.txt
id_prefix: F
---
```

All paths are relative to the project root.

## features.json

A JSON array of feature/task objects:

```json
[
  {
    "id": "F001",
    "title": "Descriptive title in imperative form",
    "status": "new",
    "priority": 1,
    "dependencies": [],
    "notes": [
      "2025-01-15: Created — initial parser design",
      "2025-01-16: Started implementation",
      "2025-01-17: Completed — 47 tests passing"
    ]
  }
]
```

### Status values
| Status | Meaning |
|--------|---------|
| `new` | Not started, ready when dependencies are met |
| `in_progress` | Actively being worked on |
| `complete` | Done, all acceptance criteria met |
| `blocked` | Cannot proceed, blocker described in notes |

### Rules
- IDs use the configured prefix + sequential number (F001, F002...)
- IDs are permanent — never renumber or reuse
- Always add a dated note when status changes
- Priority 1 is highest priority
- Dependencies reference other feature IDs

## history.txt

Chronological, append-only work log:

```
[2025-01-15 14:30] START: Beginning work on F001 (Lexer)
[2025-01-15 14:45] PROGRESS: Token enum defined, basic word tokenization working
[2025-01-15 15:30] DECISION: Using mode stack approach for quote handling
[2025-01-15 16:00] BUG: Heredoc delimiter not detected when followed by comment
[2025-01-15 16:30] FIX: Added lookahead for heredoc detection
[2025-01-15 17:00] COMPLETE: F001 lexer complete, 47 tests passing
[2025-01-15 17:05] BLOCKED: F002 needs decision on AST node allocation strategy
[2025-01-15 17:10] NOTE: Consider arena allocation for AST nodes
```

### Action types
| Action | When to use |
|--------|------------|
| `START` | Beginning work on a feature/task |
| `PROGRESS` | Meaningful progress checkpoint |
| `DECISION` | Architectural or design decision made |
| `BUG` | Bug discovered |
| `FIX` | Bug fixed |
| `COMPLETE` | Feature/task finished |
| `BLOCKED` | Hit a blocker |
| `NOTE` | General observation or reminder |

## rules.txt

Numbered, append-only list of project constraints and discoveries:

```
# Project Rules and Constraints
# Append-only — never delete entries, only add new ones

1. Heredoc content must be read AFTER the command line is fully parsed
2. SIGCHLD handler must be async-signal-safe — no allocations
3. All OSC 2337 sequences must be buffered until BEL terminator
4. Prompt rendering must complete in < 16ms for 60fps
```

### Rules
- Never delete or modify existing rules
- Number sequentially (next number = highest + 1)
- Each rule should be self-contained and actionable
- Include context for *why* the rule exists when not obvious
