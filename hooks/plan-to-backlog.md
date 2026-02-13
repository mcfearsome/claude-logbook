---
event: PostToolUse
tool_name: ExitPlanMode
type: prompt
---

A plan was just approved. Before proceeding with implementation, ensure the plan's tasks are tracked in the logbook:

1. Read `.claude/logbook.local.md` for config (default: `.claude/system/`). Read the features file.

2. For each distinct task or feature in the approved plan, check if it already exists in the features file. If not, add it with:
   - A clear imperative title
   - Status `in_progress` (since you're about to implement it)
   - Priority based on implementation order
   - Dependencies on other tasks in the plan where applicable
   - A note: "Created from plan — YYYY-MM-DD"

3. Log to history: `[YYYY-MM-DD HH:MM] START: Plan approved — added N tasks (IDs: FXXX-FYYY)`

4. Then continue with the implementation.

If the tracking files don't exist yet (no `.claude/logbook.local.md` and no `.claude/system/` directory), skip this step silently — the user hasn't initialized logbook for this project.
