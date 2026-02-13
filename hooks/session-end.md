---
event: Stop
type: prompt
---

# Session End Protocol

Before ending this session, ensure all work is properly tracked:

1. **Commit work** — If there are uncommitted changes, ask the user if they'd like to commit before ending. Use descriptive commit messages referencing feature/task IDs where applicable.

2. **Update features/tasks** — Any features or tasks you worked on should have their status updated in the tracking file:
   - Set to `complete` if finished (with completion note)
   - Set to `in_progress` if partially done (with progress note)
   - Set to `blocked` if stuck (with blocker description)

3. **Log to history** — Append entries to the history file for significant work done this session. Use the format:
   ```
   [YYYY-MM-DD HH:MM] ACTION: Description
   ```
   Where ACTION is one of: START, PROGRESS, DECISION, BUG, FIX, COMPLETE, BLOCKED

4. **Add rules** — If you discovered important constraints or patterns during this session, append them to the rules file. Rules are append-only and numbered sequentially.

5. **Summarize** — Tell the user what was accomplished and what's next.

Check `.claude/logbook.local.md` for project-specific tracking file locations. Default: `.claude/system/`.
