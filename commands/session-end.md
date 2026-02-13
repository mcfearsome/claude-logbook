---
name: logbook:end
description: Manually trigger the session end protocol
user_invocable: true
---

Manually run the session end protocol. This is the same protocol that runs automatically when Claude stops, but can be triggered explicitly.

## Steps

1. Read config from `.claude/logbook.local.md` (default: `.claude/system/`)

2. **Check git status** — Run `git status` and `git diff --stat` to see what's uncommitted.

3. **Review features** — Read the features file. For any `in_progress` items, ask the user:
   - Is this complete? (update to `complete`)
   - Still in progress? (add a progress note)
   - Blocked? (update to `blocked`, ask for blocker description)

4. **Log history** — Ask the user to summarize what was accomplished this session. Create history entries for each significant item.

5. **Check for new rules** — Ask: "Did you discover any new constraints or patterns worth recording?"

6. **Commit** — If there are uncommitted changes (including tracking file updates), ask the user if they'd like to commit. Suggest a commit message based on the work done.

7. **Summary** — Display what was accomplished and what's queued for next session.
