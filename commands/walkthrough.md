---
name: logbook:walkthrough
description: Interactive walkthrough of logbook features and how the pieces fit together
user_invocable: true
---

Walk the user through what logbook is, how it works, and what they can do with it. This should feel like a guided tour, not a wall of text.

## Steps

### 1. Welcome & Overview

Greet the user and explain what logbook does in 2-3 sentences:

Logbook is a session lifecycle and work tracking system for Claude Code. It maintains three structured files — features, history, and rules — that give every session context about what you're building, what happened before, and what constraints you've discovered. Hooks run automatically at session boundaries so nothing falls through the cracks.

### 2. The Three Tracking Files

Explain each file and what it's for. Keep descriptions short:

- **features.json** — Your backlog and task tracker. Each feature has an ID, title, status, priority, and dependencies. This is what logbook reads at session start to know what to work on next.
- **history.txt** — A chronological work log. Every significant action gets a timestamped entry. This is how future sessions know what happened in past sessions.
- **rules.txt** — Project constraints and discoveries. Things like "never use `any` type" or "the auth module can't import from the UI layer." Append-only — rules accumulate over time.

### 3. Automatic Hooks

Explain the hooks that run without the user doing anything:

- **Session Start** — Reads git status and tracking files, identifies current focus, announces what it plans to work on. This is how continuity works across sessions.
- **Session End** — Prompts you to update feature statuses, log a summary, note any new rules, and suggests a commit message. Structured handoff for the next session.
- **Plan Capture** — When you approve a plan in Claude Code, any new tasks from that plan are automatically added to features.json.
- **Gentle Reminders** — Periodically nudges you to log progress during long sessions. Non-blocking.

### 4. Commands Tour

Walk through the key commands, grouped by workflow:

**Getting started:**
- `/logbook:init` — Set up tracking files for a project
- `/logbook:backlog` — Interactively brainstorm and build a feature backlog from your codebase
- `/logbook:status` — See current project state at a glance

**Day-to-day tracking:**
- `/logbook:track <action> <description>` — Log a work entry (actions: START, PROGRESS, DECISION, BUG, FIX, COMPLETE, BLOCKED, NOTE)
- `/logbook:feature add|update|list` — Manage features and tasks
- `/logbook:rule <description>` — Record a project constraint or discovery

**Scaling up:**
- `/logbook:workspace` — Manage multiple projects with a unified view
- `/logbook:roadmap` — Launch a live web dashboard showing progress across features

### 5. Recommended First Steps

Based on whether the project is already initialized or not:

**If logbook.local.md exists:** Suggest running `/logbook:status` to see current state, then `/logbook:backlog` if the features list is empty.

**If not initialized:** Suggest running `/logbook:init` to get started, then `/logbook:backlog` to populate the first set of features.

### 6. Ask if They Want to Try Anything

End by asking if the user wants to try any of the commands right now. Offer to run one together as a hands-on demo.

## Tone

Be conversational and concise. Don't dump everything at once — present each section, let it land, then move to the next. Use short paragraphs and formatting to keep it scannable.
