#!/usr/bin/env node

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { exec } from "node:child_process";
import { existsSync } from "node:fs";

// Usage:
//   Single project:  node roadmap-server.mjs <features.json> [port]
//   Workspace:       node roadmap-server.mjs --workspace <logbook.local.md> [port]

const isWorkspace = process.argv[2] === "--workspace";
let port;
let projects = []; // { name, featuresPath }

if (isWorkspace) {
  const configPath = resolve(process.argv[3] || ".claude/logbook.local.md");
  port = parseInt(process.argv[4] || "0", 10);
  projects = await parseWorkspaceConfig(configPath);
} else {
  const featuresPath = resolve(process.argv[2] || ".claude/system/features.json");
  port = parseInt(process.argv[3] || "0", 10);
  projects = [{ name: "Project", featuresPath }];
}

async function parseWorkspaceConfig(configPath) {
  const result = [];
  try {
    const raw = await readFile(configPath, "utf-8");
    const frontmatter = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatter) return result;

    const yaml = frontmatter[1];
    const configDir = dirname(configPath);
    const parentDir = dirname(configDir);

    // Parse tracking_dir and features_file for workspace-level features
    const trackingDir = yamlVal(yaml, "tracking_dir") || ".claude/system";
    const featuresFile = yamlVal(yaml, "features_file") || "features.json";
    const workspaceFeaturesPath = resolve(parentDir, trackingDir, featuresFile);
    if (existsSync(workspaceFeaturesPath)) {
      result.push({ name: "Workspace", featuresPath: workspaceFeaturesPath });
    }

    // Parse projects block
    const projectsMatch = yaml.match(/projects:\n((?:  [\s\S]*?)(?=\n[^\s]|$))/);
    if (projectsMatch) {
      const lines = projectsMatch[1].split("\n");
      let currentProject = null;
      for (const line of lines) {
        const nameMatch = line.match(/^  ([\w-]+):/);
        const pathMatch = line.match(/^\s+path:\s*(.+)/);
        if (nameMatch) currentProject = nameMatch[1];
        if (pathMatch && currentProject) {
          const projectPath = resolve(parentDir, pathMatch[1].trim());
          // Read the project's logbook config to find its features file
          const projConfig = join(projectPath, ".claude", "logbook.local.md");
          const projFeatures = await resolveProjectFeatures(projConfig, projectPath);
          if (projFeatures) {
            result.push({ name: currentProject, featuresPath: projFeatures });
          }
          currentProject = null;
        }
      }
    }
  } catch (e) {
    console.error(`Failed to parse workspace config: ${e.message}`);
  }
  return result;
}

function yamlVal(yaml, key) {
  const m = yaml.match(new RegExp(`^${key}:\\s*(.+)`, "m"));
  return m ? m[1].trim() : null;
}

async function resolveProjectFeatures(configPath, projectRoot) {
  try {
    const raw = await readFile(configPath, "utf-8");
    const fm = raw.match(/^---\n([\s\S]*?)\n---/);
    if (fm) {
      const dir = yamlVal(fm[1], "tracking_dir") || ".claude/system";
      const file = yamlVal(fm[1], "features_file") || "features.json";
      return resolve(projectRoot, dir, file);
    }
  } catch {}
  // Fall back to default
  const fallback = resolve(projectRoot, ".claude/system/features.json");
  return existsSync(fallback) ? fallback : null;
}

async function readFeatures(path) {
  let raw;
  try {
    raw = await readFile(path, "utf-8");
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw new Error(`Failed to read features file ${path}: ${e.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON in features file ${path}: ${e.message}`);
  }

  // Handle wrapped format: { features: [...] } or { project: ..., features: [...] }
  if (parsed && !Array.isArray(parsed) && Array.isArray(parsed.features)) {
    parsed = parsed.features;
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      `Features file ${path} must be a JSON array (or { "features": [...] }), got ${typeof parsed}`
    );
  }

  // Normalize: accept "name" as alias for "title"
  for (const f of parsed) {
    if (!f.title && f.name) {
      f.title = f.name;
    }
  }

  return parsed;
}

async function readAllFeatures() {
  const all = [];
  for (const proj of projects) {
    const features = await readFeatures(proj.featuresPath);
    for (const f of features) {
      all.push({ ...f, _project: proj.name });
    }
  }
  return all;
}

function buildDashboard(allFeatures) {
  const total = allFeatures.length;
  const byStatus = { new: 0, in_progress: 0, complete: 0, blocked: 0 };
  for (const f of allFeatures) byStatus[f.status] = (byStatus[f.status] || 0) + 1;
  const pct = total > 0 ? Math.round((byStatus.complete / total) * 100) : 0;

  const isMulti = projects.length > 1;
  const title = isMulti ? "Workspace Roadmap" : "Logbook Roadmap";

  // Per-project stats
  const projStats = {};
  for (const f of allFeatures) {
    if (!projStats[f._project]) projStats[f._project] = { total: 0, complete: 0, in_progress: 0, blocked: 0, new: 0 };
    projStats[f._project].total++;
    projStats[f._project][f.status] = (projStats[f._project][f.status] || 0) + 1;
  }

  const priorities = [...allFeatures].sort((a, b) => (a.priority || 99) - (b.priority || 99));

  const statusIcon = { new: "\u25cb", in_progress: "\u25d4", complete: "\u25cf", blocked: "\u25a0" };
  const statusColor = { new: "#6b7280", in_progress: "#f59e0b", complete: "#10b981", blocked: "#ef4444" };
  const statusLabel = { new: "New", in_progress: "In Progress", complete: "Complete", blocked: "Blocked" };

  const projectCol = isMulti ? "<th>Project</th>" : "";
  const rows = priorities
    .map((f) => {
      const deps = (f.dependencies || []).join(", ") || "\u2014";
      const lastNote = f.notes?.length ? f.notes[f.notes.length - 1] : "\u2014";
      const projCell = isMulti ? `<td class="project">${esc(f._project)}</td>` : "";
      return `<tr>
        <td class="id">${esc(f.id)}</td>
        ${projCell}
        <td><span class="status-badge" style="background:${statusColor[f.status]}15;color:${statusColor[f.status]};border:1px solid ${statusColor[f.status]}30">${statusIcon[f.status]} ${statusLabel[f.status]}</span></td>
        <td class="title">${esc(f.title)}</td>
        <td class="pri">P${f.priority || "?"}</td>
        <td class="deps">${esc(deps)}</td>
        <td class="note">${esc(lastNote)}</td>
      </tr>`;
    })
    .join("\n");

  // Project breakdown cards (workspace mode only)
  const projectCards = isMulti
    ? Object.entries(projStats)
        .map(([name, s]) => {
          const p = s.total > 0 ? Math.round((s.complete / s.total) * 100) : 0;
          return `<div class="stat-card">
            <div class="label">${esc(name)}</div>
            <div class="value">${p}%</div>
            <div class="stat-detail">${s.complete}/${s.total} done &middot; ${s.in_progress} active &middot; ${s.blocked} blocked</div>
          </div>`;
        })
        .join("\n")
    : "";

  const projectFilter = isMulti
    ? `<div class="filter-bar">
        <span class="filter-label">Filter:</span>
        <button class="filter-btn active" onclick="filterProject('all')">All</button>
        ${projects.map((p) => `<button class="filter-btn" onclick="filterProject('${esc(p.name)}')">${esc(p.name)}</button>`).join("")}
      </div>`
    : "";

  const sourceInfo = isMulti
    ? `${projects.length} projects`
    : `<span class="file-path">${esc(projects[0]?.featuresPath || "")}</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
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
  .stat-detail { font-size: 0.7rem; color: var(--dim); margin-top: 0.25rem; }
  .progress-bar { width: 100%; height: 8px; background: var(--border); border-radius: 4px; margin-bottom: 2rem; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
  .filter-bar { margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
  .filter-label { font-size: 0.75rem; color: var(--dim); text-transform: uppercase; }
  .filter-btn { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; color: var(--dim); padding: 4px 12px; font-size: 0.8rem; cursor: pointer; }
  .filter-btn:hover { border-color: var(--accent); color: var(--text); }
  .filter-btn.active { background: var(--accent); color: var(--bg); border-color: var(--accent); }
  table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
  thead { background: #1c2128; }
  th { text-align: left; padding: 0.75rem 1rem; font-size: 0.75rem; color: var(--dim); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); }
  td { padding: 0.625rem 1rem; border-bottom: 1px solid var(--border); font-size: 0.875rem; }
  tr:last-child td { border-bottom: none; }
  tr:hover { background: #1c212855; }
  .id { font-family: monospace; color: var(--accent); white-space: nowrap; }
  .project { font-family: monospace; font-size: 0.8rem; color: var(--dim); }
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
  <h1>${title}</h1>
  <div class="subtitle"><span class="live-dot"></span>Live &middot; ${sourceInfo}</div>

  <div class="stats">
    <div class="stat-card"><div class="label">Total</div><div class="value">${total}</div></div>
    <div class="stat-card"><div class="label">Complete</div><div class="value" style="color:#10b981">${byStatus.complete}</div></div>
    <div class="stat-card"><div class="label">In Progress</div><div class="value" style="color:#f59e0b">${byStatus.in_progress}</div></div>
    <div class="stat-card"><div class="label">Blocked</div><div class="value" style="color:#ef4444">${byStatus.blocked}</div></div>
    <div class="stat-card"><div class="label">New</div><div class="value" style="color:#6b7280">${byStatus.new}</div></div>
    <div class="stat-card"><div class="label">Progress</div><div class="value">${pct}%</div></div>
  </div>

  ${projectCards ? `<div class="stats">${projectCards}</div>` : ""}

  <div class="progress-bar">
    <div class="progress-fill" style="width:${pct}%;background:linear-gradient(90deg,#10b981,#34d399)"></div>
  </div>

  ${projectFilter}

  ${total > 0 ? `<table>
    <thead><tr><th>ID</th>${projectCol}<th>Status</th><th>Title</th><th>Pri</th><th>Deps</th><th>Last Note</th></tr></thead>
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

    function filterProject(name) {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      event.target.classList.add("active");
      document.querySelectorAll("tbody tr").forEach(row => {
        if (name === "all") { row.style.display = ""; return; }
        const projCell = row.querySelector(".project");
        row.style.display = projCell && projCell.textContent.trim() === name ? "" : "none";
      });
    }
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

function buildErrorPage(error) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Logbook — Error</title>
<style>
  :root { --bg: #0d1117; --surface: #161b22; --border: #30363d; --text: #e6edf3; --dim: #8b949e; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text); padding: 2rem; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .error-card { background: var(--surface); border: 1px solid #ef444450; border-radius: 8px; padding: 2rem; max-width: 640px; width: 100%; }
  h1 { font-size: 1.25rem; color: #ef4444; margin-bottom: 1rem; }
  .message { font-family: monospace; font-size: 0.875rem; color: var(--text); background: var(--bg); border: 1px solid var(--border); border-radius: 4px; padding: 1rem; white-space: pre-wrap; word-break: break-word; margin-bottom: 1.5rem; }
  .hint { font-size: 0.875rem; color: var(--dim); line-height: 1.5; }
  .hint code { background: var(--bg); padding: 2px 6px; border-radius: 3px; font-size: 0.8rem; }
</style>
</head>
<body>
  <div class="error-card">
    <h1>Failed to load features</h1>
    <div class="message">${esc(error.message)}</div>
    <div class="hint">
      Expected format: a JSON array of feature objects, e.g.<br>
      <code>[{ "id": "F001", "title": "...", "status": "new", ... }]</code><br><br>
      Fix the file and this page will auto-reload.
    </div>
  </div>
  <script>setInterval(() => fetch("/api/features").then(r => { if (r.ok) location.reload(); }).catch(() => {}), 2000);</script>
</body>
</html>`;
}

const server = createServer(async (req, res) => {
  let allFeatures;
  try {
    allFeatures = await readAllFeatures();
  } catch (error) {
    console.error(error.message);
    if (req.url === "/api/features") {
      res.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
      res.end(JSON.stringify({ error: error.message }));
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(buildErrorPage(error));
    return;
  }

  if (req.url === "/api/features") {
    res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
    res.end(JSON.stringify(allFeatures));
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(buildDashboard(allFeatures));
});

server.listen(port, "127.0.0.1", () => {
  const addr = server.address();
  const url = `http://127.0.0.1:${addr.port}`;
  console.log(`Logbook roadmap server running at ${url}`);
  for (const p of projects) console.log(`  ${p.name}: ${p.featuresPath}`);
  console.log(`Press Ctrl+C to stop.\n`);

  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${cmd} ${url}`);
});

process.on("SIGINT", () => {
  console.log("\nShutting down roadmap server.");
  server.close();
  process.exit(0);
});
