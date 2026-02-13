---
event: SessionStart
type: prompt
---

# Session Start Protocol

You are starting a new coding session. Execute the following steps IN ORDER before doing anything else.

## 1. Check Git Status

Run `git status` and `git log --oneline -10` to understand what's changed since the last session. Note any uncommitted work.

## 2. Read Tracking Files

Check if a logbook configuration exists at `.claude/logbook.local.md`. If it does, read it to find the tracking directory and file names.

Default tracking file locations (if no config found):
- `.claude/system/features.json` — feature/task status tracking
- `.claude/system/history.txt` — chronological work log
- `.claude/system/rules.txt` — accumulated project constraints and discoveries

Read all tracking files that exist. If none exist, skip to step 4.

## 3. Identify Current Focus

From the features/tasks file, find:
- Items with status `in_progress` — these are active work
- Items with status `blocked` — check if blockers are now resolved
- Next `pending` or `new` item by priority whose dependencies are satisfied

## 4. Announce Plan

Before writing any code, state:
- What you found in git history and tracking files
- What you're working on and why
- What specific tasks you'll do this session
- Any blockers or questions

Only then proceed to the user's request.
