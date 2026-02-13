---
name: logbook:roadmap
description: Start a live roadmap dashboard server in the browser
user_invocable: true
args: "[port]"
---

Start a local web server that serves a live-updating roadmap dashboard from the logbook features file.

## Steps

1. Read `.claude/logbook.local.md` for config. Check if this is a **workspace** (config has a `projects` field) or a **single project**.

2. Determine the port. If `$ARGUMENTS` contains a number, use that. Otherwise, use port 0 (auto-assign).

3. Run the roadmap server in the background:

   **Single project mode** (no `projects` in config):
   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/server/roadmap-server.mjs <features-file-path> <port>
   ```

   **Workspace mode** (config has `projects` field):
   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/server/roadmap-server.mjs --workspace <path-to-logbook.local.md> <port>
   ```
   In workspace mode, the server reads features.json from every linked project and shows a unified dashboard with per-project breakdown, filter buttons, and cross-project dependency tracking.

4. The server will:
   - Serve a dashboard at `http://127.0.0.1:<port>`
   - Re-read all features files on every request (live data)
   - Auto-refresh the browser every 2 seconds when data changes
   - Open the browser automatically on startup

5. Tell the user the server is running and how to stop it (Ctrl+C in the background process, or the user can ask you to stop it).

Note: The server requires Node.js to be installed.
