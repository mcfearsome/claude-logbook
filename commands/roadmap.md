---
name: logbook:roadmap
description: Start a live roadmap dashboard server in the browser
user_invocable: true
args: "[port]"
---

Start a local web server that serves a live-updating roadmap dashboard from the logbook features file.

## Steps

1. Read `.claude/logbook.local.md` for config. Determine the features file path (default: `.claude/system/features.json`). Verify the file exists — if not, tell the user to run `/logbook:init` first.

2. Determine the port. If `$ARGUMENTS` contains a number, use that. Otherwise, use port 0 (auto-assign).

3. Run the roadmap server in the background:
   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/server/roadmap-server.mjs <features-file-path> <port>
   ```

4. The server will:
   - Serve a dashboard at `http://127.0.0.1:<port>`
   - Re-read features.json on every request (live data)
   - Auto-refresh the browser every 2 seconds when data changes
   - Open the browser automatically on startup

5. Tell the user the server is running and how to stop it (Ctrl+C in the background process, or the user can ask you to stop it).

Note: The server requires Node.js to be installed.
