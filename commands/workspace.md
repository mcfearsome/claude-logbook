---
name: logbook:workspace
description: Initialize or view a multi-project workspace that connects logbooks across repos
user_invocable: true
args: "[init|status|add <path>|remove <name>]"
---

Manage a workspace that connects logbooks across multiple repositories.

## Concept

A workspace is a parent directory (or meta-repo) that knows about multiple projects, each with their own logbook. It provides:
- A unified view of all features across projects
- Cross-project dependencies (`colony-shell:F001` depends on `colony-cloud:F003`)
- Workspace-level features that don't belong to any single repo
- An aggregated roadmap dashboard

## Workspace Config

The workspace config lives at `.claude/logbook.local.md` in the workspace root with a `projects` field:

```yaml
---
tracking_dir: .
features_file: features.json
history_file: history.txt
rules_file: rules.txt
id_prefix: W
projects:
  colony-shell:
    path: ../colony-shell
  colony-cloud:
    path: ../colony-cloud
  colony-terminal:
    path: ../colony-terminal
  colony-social:
    path: ../colony-social
  colony-web:
    path: ../colony-web
---
```

## Subcommands

### `init` — Initialize a workspace

1. Ask the user for the workspace root (default: current directory).

2. Scan for sibling directories that contain `.claude/logbook.local.md` — these are already logbook-enabled projects. List them and ask the user which to include.

3. For directories without logbook, ask if the user wants to initialize them too (run the equivalent of `/logbook:init` for each).

4. Create the workspace config at `.claude/logbook.local.md` with `projects` map. The workspace itself gets its own features.json for cross-cutting work, with ID prefix `W` to distinguish from project-level features.

5. Create workspace tracking files (features.json, history.txt, rules.txt) in the workspace root's tracking directory.

6. Log: `[YYYY-MM-DD HH:MM] INIT: Workspace initialized with N projects`

### `status` — Unified status across all projects

1. Read workspace config to find all projects.

2. For each project, read its logbook config and features file. Also read the workspace's own features file.

3. Display a unified summary:
   - Overall: total features, completion percentage across all projects
   - Per-project breakdown: name, feature count, completion %, in-progress items, blocked items
   - Workspace-level features (cross-cutting items)
   - Cross-project dependency status: any blocked dependencies across project boundaries

4. Format as a clear table.

### `add <path>` — Add a project to the workspace

1. Read workspace config.
2. Resolve the path and verify it exists.
3. Check if it has a logbook. If not, ask if the user wants to initialize one.
4. Derive a project name from the directory name.
5. Add to the `projects` map in workspace config.
6. Log: `[YYYY-MM-DD HH:MM] NOTE: Added project <name> to workspace`

### `remove <name>` — Remove a project from the workspace

1. Read workspace config.
2. Remove the named project from the `projects` map.
3. Do NOT delete the project's logbook — just unlink it from the workspace.
4. Log: `[YYYY-MM-DD HH:MM] NOTE: Removed project <name> from workspace`

### No arguments — same as `status`

## Cross-Project Dependencies

Features can reference dependencies in other projects using `project:ID` notation:

```json
{
  "id": "W001",
  "title": "E2E: shell prompt → cloud API → terminal render",
  "dependencies": ["colony-shell:F012", "colony-cloud:F003", "colony-terminal:F008"]
}
```

When displaying status, resolve cross-project dependencies by reading the referenced project's features file and checking the status of the dependency.
