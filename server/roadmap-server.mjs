#!/usr/bin/env node

import { createServer } from "node:http";
import { readFile, watch } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { exec } from "node:child_process";

const featuresPath = resolve(process.argv[2] || ".claude/system/features.json");
const port = parseInt(process.argv[3] || "0", 10);

async function readFeatures() {
  try {
    const raw = await readFile(featuresPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function buildDashboard(features) {
  const total = features.length;
  const byStatus = { new: 0, in_progress: 0, complete: 0, blocked: 0 };
  for (const f of features) byStatus[f.status] = (byStatus[f.status] || 0) + 1;
  const pct = total > 0 ? Math.round((byStatus.complete / total) * 100) : 0;

  const priorities = [...features].sort((a, b) => (a.priority || 99) - (b.priority || 99));

  const statusIcon = { new: "\u25cb", in_progress: "\u25d4", complete: "\u25cf", blocked: "\u25a0" };
  const statusColor = { new: "#6b7280", in_progress: "#f59e0b", complete: "#10b981", blocked: "#ef4444" };
  const statusLabel = { new: "New", in_progress: "In Progress", complete: "Complete", blocked: "Blocked" };

  const rows = priorities
    .map((f) => {
      const deps = (f.dependencies || []).join(", ") || "\u2014";
      const lastNote = f.notes?.length ? f.notes[f.notes.length - 1] : "\u2014";
      return `<tr>
        <td class="id">${f.id}</td>
        <td><span class="status-badge" style="background:${statusColor[f.status]}15;color:${statusColor[f.status]};border:1px solid ${statusColor[f.status]}30">${statusIcon[f.status]} ${statusLabel[f.status]}</span></td>
        <td class="title">${esc(f.title)}</td>
        <td class="pri">P${f.priority || "?"}</td>
        <td class="deps">${esc(deps)}</td>
        <td class="note">${esc(lastNote)}</td>
      </tr>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Logbook Roadmap</title>
<style>
  :root { --bg: #0d1117; --surface: #161b22; --border: #30363d; --text: #e6edf3; --dim: #8b949e; --accent: #58a6ff; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text); padding: 2rem; }
  h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.25rem; }
  .subtitle { color: var(--dim); font-size: 0.875rem; margin-bottom: 1.5rem; }
  .live-dot { display: inline-block; width: 8px; height: 8px; background: #10b981; border-radius: 50%; margin-right: 6px; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; }
  .stat-card .label { font-size: 0.75rem; color: var(--dim); text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-card .value { font-size: 1.75rem; font-weight: 700; margin-top: 0.25rem; }
  .progress-bar { width: 100%; height: 8px; background: var(--border); border-radius: 4px; margin-bottom: 2rem; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
  table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
  thead { background: #1c2128; }
  th { text-align: left; padding: 0.75rem 1rem; font-size: 0.75rem; color: var(--dim); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); }
  td { padding: 0.625rem 1rem; border-bottom: 1px solid var(--border); font-size: 0.875rem; }
  tr:last-child td { border-bottom: none; }
  tr:hover { background: #1c212855; }
  .id { font-family: monospace; color: var(--accent); white-space: nowrap; }
  .title { font-weight: 500; }
  .pri { text-align: center; font-family: monospace; color: var(--dim); }
  .deps { font-family: monospace; font-size: 0.8rem; color: var(--dim); }
  .note { font-size: 0.8rem; color: var(--dim); max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .status-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; white-space: nowrap; }
  .empty { text-align: center; padding: 3rem; color: var(--dim); }
  .file-path { font-family: monospace; font-size: 0.75rem; color: var(--dim); }
</style>
</head>
<body>
  <h1>Logbook Roadmap</h1>
  <div class="subtitle"><span class="live-dot"></span>Live — auto-refreshes on file changes &middot; <span class="file-path">${esc(featuresPath)}</span></div>

  <div class="stats">
    <div class="stat-card"><div class="label">Total</div><div class="value">${total}</div></div>
    <div class="stat-card"><div class="label">Complete</div><div class="value" style="color:#10b981">${byStatus.complete}</div></div>
    <div class="stat-card"><div class="label">In Progress</div><div class="value" style="color:#f59e0b">${byStatus.in_progress}</div></div>
    <div class="stat-card"><div class="label">Blocked</div><div class="value" style="color:#ef4444">${byStatus.blocked}</div></div>
    <div class="stat-card"><div class="label">New</div><div class="value" style="color:#6b7280">${byStatus.new}</div></div>
    <div class="stat-card"><div class="label">Progress</div><div class="value">${pct}%</div></div>
  </div>

  <div class="progress-bar">
    <div class="progress-fill" style="width:${pct}%;background:linear-gradient(90deg,#10b981,#34d399)"></div>
  </div>

  ${total > 0 ? `<table>
    <thead><tr><th>ID</th><th>Status</th><th>Title</th><th>Pri</th><th>Deps</th><th>Last Note</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>` : `<div class="empty">No features tracked yet. Run <code>/logbook:init</code> and <code>/logbook:backlog</code> to get started.</div>`}

  <script>
    let lastData = "";
    async function poll() {
      try {
        const res = await fetch("/api/features");
        const text = await res.text();
        if (text !== lastData) { lastData = text; location.reload(); }
      } catch {}
    }
    setInterval(poll, 2000);
  </script>
</body>
</html>`;
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const server = createServer(async (req, res) => {
  const features = await readFeatures();

  if (req.url === "/api/features") {
    res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
    res.end(JSON.stringify(features));
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(buildDashboard(features));
});

server.listen(port, "127.0.0.1", () => {
  const addr = server.address();
  const url = `http://127.0.0.1:${addr.port}`;
  console.log(`Logbook roadmap server running at ${url}`);
  console.log(`Watching: ${featuresPath}`);
  console.log(`Press Ctrl+C to stop.\n`);

  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${cmd} ${url}`);
});

process.on("SIGINT", () => {
  console.log("\nShutting down roadmap server.");
  server.close();
  process.exit(0);
});
