import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join, posix, relative, resolve, sep } from 'node:path';

export interface GraphNodeSymbol {
  kind: 'fn' | 'class' | 'type' | 'table' | 'view' | 'policy' | 'route';
  name: string;
  line: number;
}

export interface GraphFileNode {
  path: string;
  lines: number;
  links: string[];
  symbols: GraphNodeSymbol[];
}

export interface GraphBuildResult {
  indexPath: string;
  memoryPath: string;
  htmlPath: string;
  filesScanned: number;
  nodesEmitted: number;
  edgesCount: number;
}

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.nuxt',
  'dist',
  'build',
  'out',
  'coverage',
  '.gradle',
  '.hahahah',
  '.claude',
  '.agents',
  '.qoder',
  '.cursor',
  '.vercel',
  '.turbo',
  'vendor',
  '__pycache__',
  '.venv',
  'venv',
  'target',
]);

const CODE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.html',
  '.sql',
  '.py',
  '.go',
  '.rs',
  '.vue',
  '.svelte',
]);

const MAX_FILES_TO_SCAN = 250;
const MAX_NODES_IN_INDEX = 45;
const MAX_SYMBOLS_PER_FILE = 6;
const MAX_LINKS_PER_FILE = 5;

function toPosix(p: string): string {
  return p.split(sep).join(posix.sep);
}

function collectSourceFiles(rootDir: string): string[] {
  const results: string[] = [];

  function walk(current: string, depth: number): void {
    if (depth > 5 || results.length >= MAX_FILES_TO_SCAN) return;
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (results.length >= MAX_FILES_TO_SCAN) break;
      if (entry.name.startsWith('.') && entry.name !== '.well-known') continue;
      if (IGNORED_DIRS.has(entry.name)) continue;
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, depth + 1);
      } else if (entry.isFile() && CODE_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
        try {
          const st = statSync(fullPath);
          if (st.size <= 512 * 1024) {
            results.push(fullPath);
          }
        } catch {
          // ignore unreadable file
        }
      }
    }
  }

  walk(rootDir, 0);
  return results.sort();
}

function extractNode(rootDir: string, filePath: string, allRelativePaths: Set<string>): GraphFileNode {
  const relPath = toPosix(relative(rootDir, filePath));
  const ext = extname(filePath).toLowerCase();
  const raw = readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);

  const symbols: GraphNodeSymbol[] = [];
  const linksSet = new Set<string>();
  const dirPosix = posix.dirname(relPath);

  const resolveLocalRef = (spec: string): string | null => {
    const clean = spec.split(/[?#]/)[0]?.trim() ?? '';
    if (!clean) return null;
    const candidates: string[] = [];
    if (clean.startsWith('.')) {
      const joined = posix.normalize(posix.join(dirPosix, clean));
      const withoutExt = joined.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, '');
      candidates.push(
        joined,
        `${joined}.ts`,
        `${joined}.tsx`,
        `${joined}.js`,
        `${joined}.mjs`,
        `${withoutExt}.ts`,
        `${withoutExt}.tsx`,
        `${withoutExt}.js`,
        posix.join(joined, 'index.ts'),
        posix.join(joined, 'index.tsx'),
        posix.join(joined, 'index.js'),
      );
    } else if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('//')) {
      const stripped = clean.replace(/^\//, '');
      candidates.push(stripped, posix.normalize(posix.join(dirPosix, stripped)));
    }
    for (const cand of candidates) {
      if (allRelativePaths.has(cand) && cand !== relPath) {
        return cand;
      }
    }
    return null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const lineNum = i + 1;

    if (ext === '.html') {
      const attrMatches = line.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi);
      for (const m of attrMatches) {
        const target = resolveLocalRef(m[1] ?? '');
        if (target) linksSet.add(target);
      }
    } else {
      const importMatch =
        line.match(/\bfrom\s+["']([^"']+)["']/) ??
        line.match(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/) ??
        line.match(/\brequire\s*\(\s*["']([^"']+)["']\s*\)/);
      if (importMatch?.[1]) {
        const target = resolveLocalRef(importMatch[1]);
        if (target) linksSet.add(target);
      }
    }

    if (symbols.length >= MAX_SYMBOLS_PER_FILE) continue;

    if (ext === '.sql') {
      const tableMatch = line.match(/^\s*create\s+table\s+(?:if\s+not\s+exists\s+)?(?:[\w]+\.)?["`]?([a-zA-Z0-9_]+)["`]?/i);
      if (tableMatch?.[1]) {
        symbols.push({ kind: 'table', name: tableMatch[1], line: lineNum });
        continue;
      }
      const viewMatch = line.match(/^\s*create\s+(?:or\s+replace\s+)?view\s+(?:[\w]+\.)?["`]?([a-zA-Z0-9_]+)["`]?/i);
      if (viewMatch?.[1]) {
        symbols.push({ kind: 'view', name: viewMatch[1], line: lineNum });
        continue;
      }
      const policyMatch = line.match(/^\s*create\s+policy\s+["']?([a-zA-Z0-9_ -]+)["']?/i);
      if (policyMatch?.[1]) {
        symbols.push({ kind: 'policy', name: policyMatch[1].trim(), line: lineNum });
        continue;
      }
    } else if (ext === '.py') {
      const pyMatch = line.match(/^(?:async\s+)?def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(|^class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (pyMatch) {
        symbols.push({
          kind: pyMatch[1] ? 'fn' : 'class',
          name: (pyMatch[1] ?? pyMatch[2])!,
          line: lineNum,
        });
      }
    } else if (ext === '.go') {
      const goMatch = line.match(/^func\s+(?:\([^)]+\)\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
      if (goMatch?.[1]) {
        symbols.push({ kind: 'fn', name: goMatch[1], line: lineNum });
      }
    } else if (ext === '.rs') {
      const rsMatch = line.match(/^\s*pub\s+(?:async\s+)?fn\s+([a-zA-Z_][a-zA-Z0-9_]*)|^\s*pub\s+struct\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (rsMatch) {
        symbols.push({
          kind: rsMatch[1] ? 'fn' : 'class',
          name: (rsMatch[1] ?? rsMatch[2])!,
          line: lineNum,
        });
      }
    } else {
      const fnMatch =
        line.match(/^\s*export\s+(?:default\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)/) ??
        line.match(/^\s*(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/) ??
        line.match(/^\s*export\s+const\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\(/);
      if (fnMatch?.[1]) {
        symbols.push({ kind: 'fn', name: fnMatch[1], line: lineNum });
        continue;
      }
      const clsMatch = line.match(/^\s*export\s+(?:default\s+)?class\s+([A-Za-z0-9_$]+)/);
      if (clsMatch?.[1]) {
        symbols.push({ kind: 'class', name: clsMatch[1], line: lineNum });
        continue;
      }
      const typeMatch = line.match(/^\s*export\s+(?:interface|type)\s+([A-Za-z0-9_$]+)/);
      if (typeMatch?.[1]) {
        symbols.push({ kind: 'type', name: typeMatch[1], line: lineNum });
      }
    }
  }

  return {
    path: relPath,
    lines: lines.length,
    links: [...linksSet].slice(0, MAX_LINKS_PER_FILE),
    symbols,
  };
}

const DEFAULT_MEMORY_TEMPLATE = `# 🧠 Active Session Memory (Obsidian State Node)

Use this file to persist 1–3 lines of architectural state or pending tasks across chat resets (\`/compact\`).
Link code nodes using \`[[path/to/file#symbol]]\` or \`file:line\`.

## Current State
- Status: Initialized by \`anti-yapping graph\`.
- Next step: Update this bullet after completing major audits or multi-file fixes.
`;

function classifyNodeCategory(filePath: string): 'memory' | 'entrypoint' | 'sql' | 'test' | 'module' {
  if (filePath.endsWith('memory.md') || filePath.endsWith('INDEX.md')) return 'memory';
  if (filePath.endsWith('.sql')) return 'sql';
  if (filePath.includes('test/') || filePath.includes('.test.') || filePath.includes('.spec.')) return 'test';
  const base = posix.basename(filePath);
  if (/^(index|app|main|server|cli)\./i.test(base) || filePath.endsWith('.html')) return 'entrypoint';
  return 'module';
}

function renderInteractiveGraphHtml(
  projectName: string,
  nodes: GraphFileNode[],
  memoryContent: string,
  indexTokensEst: number,
): string {
  const nodePathSet = new Set(nodes.map((n) => n.path));

  // Detect any file references mentioned inside memory.md
  const memoryLinks: string[] = [];
  for (const p of nodePathSet) {
    const base = posix.basename(p);
    if (memoryContent.includes(p) || (base.length > 4 && memoryContent.includes(base))) {
      memoryLinks.push(p);
    }
  }
  if (memoryLinks.length === 0) {
    // Link memory hub to top entrypoints so it anchors the constellation visually
    for (const n of nodes) {
      if (classifyNodeCategory(n.path) === 'entrypoint') {
        memoryLinks.push(n.path);
      }
    }
    if (memoryLinks.length === 0 && nodes[0]) {
      memoryLinks.push(nodes[0].path);
    }
  }

  const graphNodes = [
    {
      id: '.hahahah/graph/memory.md',
      label: '🧠 memory.md',
      category: 'memory',
      lines: memoryContent.split(/\r?\n/).length,
      links: memoryLinks,
      symbols: [{ kind: 'fn', name: 'Active Session State', line: 1 }],
    },
    ...nodes.map((n) => ({
      id: n.path,
      label: n.path,
      category: classifyNodeCategory(n.path),
      lines: n.lines,
      links: n.links.filter((l) => nodePathSet.has(l)),
      symbols: n.symbols,
    })),
  ];

  const payloadJson = JSON.stringify({
    projectName,
    indexTokensEst,
    memoryContent,
    nodes: graphNodes,
  }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${projectName} — Anti-Yapping Knowledge Graph</title>
<style>
  :root {
    --bg: #090b10;
    --panel: rgba(16, 19, 28, 0.88);
    --border: rgba(255, 255, 255, 0.1);
    --text: #e2e8f0;
    --muted: #94a3b8;
    --memory: #10b981;
    --entry: #f97316;
    --sql: #06b6d4;
    --test: #a855f7;
    --module: #6366f1;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: radial-gradient(circle at 50% 50%, #111522 0%, #07080d 100%);
    color: var(--text);
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    overflow: hidden;
    height: 100vh;
    width: 100vw;
    user-select: none;
  }
  canvas {
    display: block;
    width: 100vw;
    height: 100vh;
    cursor: grab;
  }
  canvas:active { cursor: grabbing; }
  .hud-top {
    position: fixed;
    top: 16px;
    left: 16px;
    right: 360px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    pointer-events: none;
    z-index: 10;
  }
  .badge-card {
    pointer-events: auto;
    background: var(--panel);
    backdrop-filter: blur(12px);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 8px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.45);
    font-size: 13px;
  }
  .brand-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--memory);
    box-shadow: 0 0 12px var(--memory);
  }
  .search-input {
    pointer-events: auto;
    background: var(--panel);
    backdrop-filter: blur(12px);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: 10px;
    padding: 8px 14px;
    font-size: 13px;
    width: 240px;
    outline: none;
    transition: border-color 0.2s;
  }
  .search-input:focus {
    border-color: var(--memory);
  }
  .btn {
    pointer-events: auto;
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: 8px;
    padding: 7px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn:hover {
    background: rgba(255,255,255,0.14);
    border-color: rgba(255,255,255,0.25);
  }
  .legend {
    position: fixed;
    bottom: 16px;
    left: 16px;
    background: var(--panel);
    backdrop-filter: blur(12px);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 14px;
    display: flex;
    gap: 14px;
    font-size: 12px;
    color: var(--muted);
    z-index: 10;
  }
  .legend-item { display: flex; align-items: center; gap: 6px; }
  .dot { width: 9px; height: 9px; border-radius: 50%; }
  .sidebar {
    position: fixed;
    top: 16px;
    right: 16px;
    bottom: 16px;
    width: 330px;
    background: var(--panel);
    backdrop-filter: blur(16px);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow-y: auto;
    box-shadow: 0 12px 40px rgba(0,0,0,0.6);
    z-index: 10;
    user-select: text;
  }
  .sidebar h2 {
    font-size: 15px;
    font-weight: 700;
    word-break: break-all;
    line-height: 1.35;
  }
  .cat-pill {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 3px 8px;
    border-radius: 999px;
    width: fit-content;
  }
  .sec-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--muted);
    margin-bottom: 6px;
  }
  .pill-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .item-row {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 7px;
    padding: 6px 9px;
    font-size: 12px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: background 0.15s;
  }
  .item-row:hover {
    background: rgba(255,255,255,0.1);
  }
  .line-tag {
    color: var(--memory);
    font-size: 11px;
  }
  .memory-box {
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 8px;
    padding: 10px;
    font-size: 12px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    white-space: pre-wrap;
    color: #d1fae5;
    line-height: 1.45;
  }
</style>
</head>
<body>
  <div class="hud-top">
    <div class="badge-card">
      <span class="brand-dot"></span>
      <strong>${projectName}</strong>
      <span style="color:var(--muted)" id="stats-label"></span>
    </div>
    <input type="text" id="search" class="search-input" placeholder="Search node or symbol (e.g. login)..." />
    <button class="btn" id="reset-btn">Center Graph</button>
  </div>

  <div class="legend">
    <div class="legend-item"><span class="dot" style="background:var(--memory)"></span>Memory Hub</div>
    <div class="legend-item"><span class="dot" style="background:var(--entry)"></span>Entrypoint</div>
    <div class="legend-item"><span class="dot" style="background:var(--module)"></span>Code Module</div>
    <div class="legend-item"><span class="dot" style="background:var(--sql)"></span>SQL / Schema</div>
    <div class="legend-item"><span class="dot" style="background:var(--test)"></span>Test Suite</div>
  </div>

  <aside class="sidebar" id="sidebar">
    <span class="cat-pill" id="node-cat">MEMORY HUB</span>
    <h2 id="node-title">.hahahah/graph/memory.md</h2>
    <div style="font-size:12px;color:var(--muted)" id="node-meta"></div>
    <div id="memory-section" style="display:none">
      <div class="sec-title">Active Session Handoff</div>
      <div class="memory-box" id="memory-text"></div>
    </div>
    <div>
      <div class="sec-title" id="sym-header">Symbols & Line Anchors</div>
      <div class="pill-list" id="sym-list"></div>
    </div>
    <div>
      <div class="sec-title">Outgoing Links (Imports)</div>
      <div class="pill-list" id="out-list"></div>
    </div>
    <div>
      <div class="sec-title">Incoming Backlinks (Used By)</div>
      <div class="pill-list" id="in-list"></div>
    </div>
  </aside>

  <canvas id="graph"></canvas>

  <script id="graph-data" type="application/json">${payloadJson}</script>
  <script>
    const data = JSON.parse(document.getElementById('graph-data').textContent);
    const COLORS = {
      memory: '#10b981',
      entrypoint: '#f97316',
      sql: '#06b6d4',
      test: '#a855f7',
      module: '#6366f1'
    };

    const canvas = document.getElementById('graph');
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const nodes = data.nodes.map((n, i) => {
      const angle = (i / data.nodes.length) * Math.PI * 2;
      const radius = n.category === 'memory' ? 0 : 120 + (i % 3) * 70;
      return {
        ...n,
        x: width / 2 - 140 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        r: n.category === 'memory' ? 14 : Math.max(6, Math.min(13, 5 + Math.sqrt(n.symbols.length + n.links.length) * 2))
      };
    });

    const nodeById = new Map(nodes.map(n => [n.id, n]));
    const edges = [];
    const backlinks = new Map(nodes.map(n => [n.id, []]));

    for (const n of nodes) {
      for (const targetId of n.links) {
        const target = nodeById.get(targetId);
        if (target) {
          edges.push({ source: n, target, isMemory: n.category === 'memory' });
          backlinks.get(targetId).push(n.id);
        }
      }
    }

    document.getElementById('stats-label').textContent =
      \`\${nodes.length} nodes • \${edges.length} edges • ~\${data.indexTokensEst} tokens\`;

    let selectedNode = nodes[0];
    let hoveredNode = null;
    let draggedNode = null;
    let panX = 0, panY = 0, zoom = 1;
    let isPanning = false, startPanX = 0, startPanY = 0;
    let searchQuery = '';

    function selectNode(node) {
      selectedNode = node;
      const catEl = document.getElementById('node-cat');
      catEl.textContent = node.category.toUpperCase();
      catEl.style.background = COLORS[node.category] + '28';
      catEl.style.color = COLORS[node.category];
      catEl.style.border = '1px solid ' + COLORS[node.category] + '66';

      document.getElementById('node-title').textContent = node.id;
      document.getElementById('node-meta').textContent = \`\${node.lines} lines • \${node.symbols.length} symbol(s) • \${node.links.length} outgoing link(s)\`;

      const memSec = document.getElementById('memory-section');
      if (node.category === 'memory') {
        memSec.style.display = 'block';
        document.getElementById('memory-text').textContent = data.memoryContent.trim();
      } else {
        memSec.style.display = 'none';
      }

      const symList = document.getElementById('sym-list');
      symList.innerHTML = '';
      if (node.symbols.length === 0) {
        symList.innerHTML = '<div style="font-size:12px;color:var(--muted)">No exported symbols</div>';
      } else {
        for (const s of node.symbols) {
          const row = document.createElement('div');
          row.className = 'item-row';
          row.innerHTML = \`<span><strong style="color:var(--muted)">\${s.kind}</strong> \${s.name}</span><span class="line-tag">:\${s.line}</span>\`;
          symList.appendChild(row);
        }
      }

      const outList = document.getElementById('out-list');
      outList.innerHTML = '';
      if (node.links.length === 0) {
        outList.innerHTML = '<div style="font-size:12px;color:var(--muted)">None</div>';
      } else {
        for (const l of node.links) {
          const row = document.createElement('div');
          row.className = 'item-row';
          row.innerHTML = \`<span>[[\${l}]]</span><span class="line-tag">➔</span>\`;
          row.onclick = () => { const t = nodeById.get(l); if (t) selectNode(t); };
          outList.appendChild(row);
        }
      }

      const inList = document.getElementById('in-list');
      inList.innerHTML = '';
      const inc = backlinks.get(node.id) || [];
      if (inc.length === 0) {
        inList.innerHTML = '<div style="font-size:12px;color:var(--muted)">None</div>';
      } else {
        for (const callerId of inc) {
          const row = document.createElement('div');
          row.className = 'item-row';
          row.innerHTML = \`<span>[[\${callerId}]]</span><span class="line-tag">⬅</span>\`;
          row.onclick = () => { const t = nodeById.get(callerId); if (t) selectNode(t); };
          inList.appendChild(row);
        }
      }
    }

    selectNode(selectedNode);

    function screenToWorld(sx, sy) {
      return {
        x: (sx - width / 2 - panX) / zoom + width / 2,
        y: (sy - height / 2 - panY) / zoom + height / 2
      };
    }

    canvas.addEventListener('mousedown', (e) => {
      const pos = screenToWorld(e.clientX, e.clientY);
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (Math.hypot(pos.x - n.x, pos.y - n.y) <= n.r + 5) {
          draggedNode = n;
          selectNode(n);
          return;
        }
      }
      isPanning = true;
      startPanX = e.clientX - panX;
      startPanY = e.clientY - panY;
    });

    window.addEventListener('mousemove', (e) => {
      const pos = screenToWorld(e.clientX, e.clientY);
      if (draggedNode) {
        draggedNode.x = pos.x;
        draggedNode.y = pos.y;
        draggedNode.vx = 0;
        draggedNode.vy = 0;
        return;
      }
      if (isPanning) {
        panX = e.clientX - startPanX;
        panY = e.clientY - startPanY;
        return;
      }
      hoveredNode = null;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (Math.hypot(pos.x - n.x, pos.y - n.y) <= n.r + 5) {
          hoveredNode = n;
          break;
        }
      }
      canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
    });

    window.addEventListener('mouseup', () => {
      draggedNode = null;
      isPanning = false;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      zoom = Math.max(0.35, Math.min(3.0, zoom * factor));
    }, { passive: false });

    document.getElementById('search').addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
      panX = 0; panY = 0; zoom = 1;
    });

    window.addEventListener('resize', () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    });

    function matchesSearch(n) {
      if (!searchQuery) return true;
      if (n.id.toLowerCase().includes(searchQuery)) return true;
      return n.symbols.some(s => s.name.toLowerCase().includes(searchQuery));
    }

    function stepPhysics() {
      const centerX = width / 2 - 140;
      const centerY = height / 2;

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = b.x - a.x || 0.1;
          const dy = b.y - a.y || 0.1;
          const distSq = dx * dx + dy * dy;
          const minDist = 30;
          const force = 2600 / Math.max(distSq, minDist * minDist);
          const dist = Math.sqrt(distSq) || 1;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }

      for (const e of edges) {
        const dx = e.target.x - e.source.x;
        const dy = e.target.y - e.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = e.isMemory ? 150 : 115;
        const k = 0.025;
        const force = (dist - targetDist) * k;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        e.source.vx += fx;
        e.source.vy += fy;
        e.target.vx -= fx;
        e.target.vy -= fy;
      }

      for (const n of nodes) {
        if (n === draggedNode) continue;
        const gravity = n.category === 'memory' ? 0.04 : 0.008;
        n.vx += (centerX - n.x) * gravity;
        n.vy += (centerY - n.y) * gravity;
        n.vx *= 0.82;
        n.vy *= 0.82;
        n.x += n.vx;
        n.y += n.vy;
      }
    }

    function draw() {
      stepPhysics();
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2 + panX, height / 2 + panY);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      // Draw edges
      for (const e of edges) {
        const isHighlighted =
          selectedNode === e.source ||
          selectedNode === e.target ||
          hoveredNode === e.source ||
          hoveredNode === e.target;

        ctx.beginPath();
        ctx.moveTo(e.source.x, e.source.y);
        ctx.lineTo(e.target.x, e.target.y);
        if (e.isMemory) {
          ctx.strokeStyle = isHighlighted ? 'rgba(16, 185, 129, 0.85)' : 'rgba(16, 185, 129, 0.28)';
          ctx.setLineDash([4, 4]);
        } else {
          ctx.strokeStyle = isHighlighted ? 'rgba(148, 163, 184, 0.85)' : 'rgba(148, 163, 184, 0.18)';
          ctx.setLineDash([]);
        }
        ctx.lineWidth = isHighlighted ? 2 : 1.1;
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw nodes
      for (const n of nodes) {
        const active = matchesSearch(n);
        const isSel = n === selectedNode || n === hoveredNode;
        const color = COLORS[n.category] || COLORS.module;

        ctx.globalAlpha = active ? 1 : 0.18;

        if (isSel || n.category === 'memory') {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + (isSel ? 7 : 5), 0, Math.PI * 2);
          ctx.fillStyle = color + '33';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = isSel ? 2.5 : 1.2;
        ctx.strokeStyle = isSel ? '#ffffff' : '#090b10';
        ctx.stroke();

        // Node label
        ctx.font = (isSel || n.category === 'memory' ? '600 ' : '500 ') + '11px ui-sans-serif, system-ui, sans-serif';
        ctx.fillStyle = isSel ? '#ffffff' : '#cbd5e1';
        ctx.textAlign = 'center';
        const shortLabel = n.id.length > 28 ? '…' + n.id.slice(-26) : n.label;
        ctx.fillText(shortLabel, n.x, n.y + n.r + 14);
      }

      ctx.globalAlpha = 1;
      ctx.restore();
      requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
  </script>
</body>
</html>`;
}

export function buildCodeGraph(targetRoot: string): GraphBuildResult {
  const rootDir = resolve(targetRoot);
  const graphDir = join(rootDir, '.hahahah', 'graph');
  mkdirSync(graphDir, { recursive: true });

  const absFiles = collectSourceFiles(rootDir);
  const allRelativePaths = new Set(absFiles.map((f) => toPosix(relative(rootDir, f))));

  const nodes = absFiles.map((file) => extractNode(rootDir, file, allRelativePaths));

  const scoredNodes = nodes
    .map((node) => {
      let score = node.symbols.length * 2 + node.links.length * 3;
      if (/^(index|app|main|server|cli|schema|supabase)/i.test(posix.basename(node.path))) score += 10;
      if (node.path.endsWith('.sql') || node.path.endsWith('.html')) score += 6;
      if (!node.path.includes('test/') && !node.path.includes('.test.')) score += 4;
      return { node, score };
    })
    .sort((a, b) => b.score - a.score || a.node.path.localeCompare(b.node.path))
    .slice(0, MAX_NODES_IN_INDEX)
    .map((item) => item.node)
    .sort((a, b) => a.path.localeCompare(b.path));

  let edgesCount = 0;
  const nodeLines = scoredNodes.map((n) => {
    edgesCount += n.links.length;
    const linkPart = n.links.length > 0 ? ` ➔ ${n.links.map((l) => `[[${l}]]`).join(', ')}` : '';
    const symPart =
      n.symbols.length > 0
        ? ` | ${n.symbols.map((s) => `${s.kind === 'table' || s.kind === 'view' ? `${s.kind}:` : ''}\`${s.name}\`:${s.line}`).join(', ')}`
        : '';
    return `- [[${n.path}]] (${n.lines}L)${linkPart}${symPart}`;
  });

  const indexContent = [
    '# 🗺️ Codebase Knowledge Graph (INDEX)',
    '',
    '> Read this map FIRST before grepping or reading full files. Follow `[[wikilinks]]` and `:line` anchors to read only the exact 20–40 lines needed.',
    '',
    '## Active Memory Handoff',
    '- [[.hahahah/graph/memory.md]] — Read/update 1–3 line state summary before or after `/compact`.',
    '',
    `## Nodes (${scoredNodes.length} of ${nodes.length} files mapped)`,
    ...(nodeLines.length > 0 ? nodeLines : ['- *(No source files detected yet)*']),
    '',
  ].join('\n');

  const indexPath = join(graphDir, 'INDEX.md');
  const memoryPath = join(graphDir, 'memory.md');
  const htmlPath = join(graphDir, 'graph.html');

  writeFileSync(indexPath, indexContent, 'utf8');
  if (!existsSync(memoryPath)) {
    writeFileSync(memoryPath, DEFAULT_MEMORY_TEMPLATE, 'utf8');
  }

  const currentMemory = readFileSync(memoryPath, 'utf8');
  const estTokens = Math.max(50, Math.round(indexContent.length / 3.8));
  const projectName = basename(rootDir) || 'Project';
  const htmlContent = renderInteractiveGraphHtml(projectName, scoredNodes, currentMemory, estTokens);
  writeFileSync(htmlPath, htmlContent, 'utf8');

  return {
    indexPath,
    memoryPath,
    htmlPath,
    filesScanned: nodes.length,
    nodesEmitted: scoredNodes.length,
    edgesCount,
  };
}

export function removeCodeGraph(targetRoot: string): void {
  const graphDir = join(resolve(targetRoot), '.hahahah', 'graph');
  if (existsSync(graphDir)) {
    rmSync(graphDir, { recursive: true, force: true });
  }
}
