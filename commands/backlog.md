---
name: logbook:backlog
description: Build or refine a project backlog through interactive brainstorming
user_invocable: true
args: "[from <file>]"
---

Interactively build a backlog of features and tasks for the project.

## Modes

### Interactive brainstorm (no arguments)

1. Read `.claude/logbook.local.md` for config, fall back to defaults. Read the features file to see what already exists.

2. Explore the codebase to understand the project structure, purpose, and current state. Read key files (README, CLAUDE.md, main entry points, config files).

3. Present your understanding of the project and ask the user what area they want to build a backlog for. Examples:
   - "The whole project" — comprehensive feature breakdown
   - A specific module, component, or capability
   - A milestone or release goal

4. Brainstorm features with the user interactively:
   - Propose 5-8 features based on your codebase understanding
   - Ask the user to confirm, modify, remove, or add to the list
   - For each confirmed feature, collaboratively determine:
     - Title (imperative form: "Add X", "Implement Y")
     - Priority (1 = highest)
     - Dependencies on other features in this batch or existing features
   - Continue rounds until the user is satisfied

5. Write all features to the features file with sequential IDs using the configured prefix. Each gets status `new` and a creation note.

6. Log to history: `[YYYY-MM-DD HH:MM] NOTE: Added N features to backlog (IDs: F001-F00N)`

7. Display the final backlog as a formatted table.

### Import from file (`from <file>`)

1. Read the specified file. Support these formats:
   - **Markdown** — extract headings, bullet points, or task lists as features
   - **JSON** — expect an array of objects with at least `title` fields
   - **Plain text** — one feature per line

2. Parse and present the extracted features to the user for review. Let them edit titles, set priorities, and define dependencies before committing.

3. Write to features file and log to history, same as interactive mode.

## Guidelines

- Don't create overly granular tasks. Each feature should represent a meaningful unit of work.
- Group related work into single features rather than splitting into tiny pieces.
- Suggest a logical priority ordering based on dependencies and foundational work.
- If the backlog already has features, show them first so the user can see what's covered.
