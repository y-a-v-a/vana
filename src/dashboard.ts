import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadConfig, type Config } from "./config.ts";
import type { GeneratedMeta } from "./generator.ts";
import type { JuryVerdict } from "./jury.ts";
import { isValidId } from "./ids.ts";
import { decide, type Decision } from "./promote.ts";

export interface PendingItem {
  id: string;
  meta: GeneratedMeta;
  verdict: JuryVerdict;
}

// ── Rendering (pure, testable) ───────────────────────────────────────────────
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const STYLE = `
  :root{--ink:#1a1a1a;--muted:#6b6b6b;--line:#e3e0d8;--paper:#f4f1e9;--accent:#002fa7}
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 Georgia,serif}
  header{padding:1.2rem 1.5rem;border-bottom:1px solid var(--line)}
  header a{color:var(--accent);text-decoration:none}
  main{max-width:60rem;margin:0 auto;padding:1.5rem}
  .badge{display:inline-block;padding:.1rem .5rem;border-radius:.2rem;font:600 13px/1.4 monospace;color:#fff}
  .strong{background:#1a7a3a}.borderline{background:#b8860b}.reject{background:#a02020}
  .card{border:1px solid var(--line);border-radius:.4rem;padding:1rem 1.2rem;margin:1rem 0;background:#fff}
  .muted{color:var(--muted)}
  .scores{font:13px/1.6 monospace}
  iframe{width:100%;height:60vh;border:1px solid var(--line);border-radius:.4rem;background:#fff}
  pre{white-space:pre-wrap;font:14px/1.55 Georgia,serif;background:#faf8f2;padding:1rem;border-radius:.3rem}
  form{display:inline}
  button{font:600 15px/1 Georgia,serif;padding:.6rem 1.4rem;border-radius:.3rem;border:1px solid var(--line);cursor:pointer}
  .approve{background:#1a7a3a;color:#fff;border-color:#1a7a3a}
  .rejectbtn{background:#fff;color:#a02020;border-color:#a02020;margin-left:.5rem}
`;

function shell(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title><style>${STYLE}</style></head>
<body><header><a href="/">vana</a> · approval gateway</header><main>${body}</main></body></html>`;
}

export function renderIndex(items: PendingItem[]): string {
  if (items.length === 0) {
    return shell("vana · pending", `<p class="muted">No candidates awaiting confirmation.</p>`);
  }
  const rows = items
    .map(
      (it) => `<div class="card">
  <a href="/candidate/${encodeURIComponent(it.id)}"><strong>${escapeHtml(it.meta.title)}</strong></a>
  <span class="badge ${it.verdict.verdict}">${it.verdict.verdict} ${it.verdict.weighted_total}/50</span>
  <div class="muted">${escapeHtml(it.meta.summary)}</div>
</div>`,
    )
    .join("\n");
  return shell("vana · pending", `<h1>Pending (${items.length})</h1>${rows}`);
}

/** The work iframe + jury card, shared by the pending and resolved views. */
function workAndJury(id: string, meta: GeneratedMeta, verdict: JuryVerdict): string {
  const s = verdict.scores;
  return `
  <iframe src="/candidate/${encodeURIComponent(id)}/work" title="work" sandbox="allow-scripts allow-downloads" referrerpolicy="no-referrer"></iframe>
  <div class="card">
    <div class="scores">novelty ${s.novelty} · nuance ${s.nuance} · narrative ${s.narrative} · craft ${s.craft} · wit ${s.wit}</div>
    <p><strong>Jury:</strong> ${escapeHtml(verdict.rationale)}</p>
    ${verdict.reservations ? `<p class="muted"><strong>Reservations:</strong> ${escapeHtml(verdict.reservations)}</p>` : ""}
    <p class="muted">Principles: ${escapeHtml(verdict.principles_invoked.join(", "))} · License: ${escapeHtml(meta.license)} · Jury: ${escapeHtml(verdict.jury_model)}</p>
  </div>`;
}

export function renderCandidate(
  id: string,
  meta: GeneratedMeta,
  verdict: JuryVerdict,
  motivation: string,
): string {
  const body = `
  <h1>${escapeHtml(meta.title)} <span class="badge ${verdict.verdict}">${verdict.verdict} ${verdict.weighted_total}/50</span></h1>
  <p>${escapeHtml(meta.summary)}</p>
  ${workAndJury(id, meta, verdict)}
  <div class="card">
    <form method="POST" action="/candidate/${encodeURIComponent(id)}/approve"><button class="approve" type="submit">Approve → publish</button></form>
    <form method="POST" action="/candidate/${encodeURIComponent(id)}/reject"><button class="rejectbtn" type="submit">Reject</button></form>
  </div>
  <h2>Motivation</h2>
  <pre>${escapeHtml(motivation)}</pre>`;
  return shell(`vana · ${meta.title}`, body);
}

/** A candidate that has already been decided — no action buttons, just status. */
export function renderResolved(
  id: string,
  meta: GeneratedMeta,
  verdict: JuryVerdict,
  status: "published" | "rejected",
  motivation: string,
): string {
  const note =
    status === "published"
      ? `<strong>Published ✓</strong> — you already approved this; it lives in the catalogue.`
      : `<strong>Rejected</strong> — this candidate was set aside.`;
  const body = `
  <h1>${escapeHtml(meta.title)} <span class="badge ${verdict.verdict}">${verdict.verdict} ${verdict.weighted_total}/50</span></h1>
  <div class="card">${note} &nbsp; <a href="/">← back to pending</a></div>
  ${workAndJury(id, meta, verdict)}
  <h2>Motivation</h2>
  <pre>${escapeHtml(motivation)}</pre>`;
  return shell(`vana · ${meta.title}`, body);
}

export function renderNotFound(): string {
  return shell(
    "vana · not found",
    `<h1>Nothing here</h1><p class="muted">That page doesn't exist. <a href="/">← back to pending</a></p>`,
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────
export function listPending(cfg: Config): PendingItem[] {
  if (!existsSync(cfg.abs.pending)) return [];
  const items: PendingItem[] = [];
  for (const entry of readdirSync(cfg.abs.pending, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(cfg.abs.pending, entry.name);
    try {
      const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8")) as GeneratedMeta;
      const verdict = JSON.parse(readFileSync(join(dir, "jury.json"), "utf8")) as JuryVerdict;
      items.push({ id: entry.name, meta, verdict });
    } catch {
      // skip malformed candidate dirs
    }
  }
  return items.sort((a, b) => a.id.localeCompare(b.id));
}

export type Lifecycle = "pending" | "published" | "rejected";

/** Find which lifecycle dir holds a candidate, searching pending→published→rejected. */
export function candidateLocation(cfg: Config, id: string): { status: Lifecycle; dir: string } | null {
  const roots: [Lifecycle, string][] = [
    ["pending", cfg.abs.pending],
    ["published", cfg.abs.published],
    ["rejected", cfg.abs.rejected],
  ];
  for (const [status, root] of roots) {
    const dir = join(root, id);
    if (existsSync(dir)) return { status, dir };
  }
  return null;
}

// CSP for a rendered work: it must make ZERO external requests. This is the real
// enforcement of self-containment (the generator regex is only a first pass).
// default-src 'none' blocks external loads; connect-src 'none' blocks
// fetch/XHR/WebSocket/sendBeacon/EventSource; inline + data: + blob: are allowed
// so legitimately self-contained works still render.
export const WORK_CSP =
  "default-src 'none'; img-src data: blob:; media-src data: blob:; " +
  "style-src 'unsafe-inline'; script-src 'unsafe-inline' 'unsafe-eval' blob:; " +
  "font-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'";

// ── Server ───────────────────────────────────────────────────────────────────
function send(res: ServerResponse, status: number, type: string, body: string): void {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

async function handle(req: IncomingMessage, res: ServerResponse, cfg: Config): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean); // e.g. ["candidate","<id>","work"]

  if (req.method === "GET" && parts.length === 0) {
    return send(res, 200, "text/html; charset=utf-8", renderIndex(listPending(cfg)));
  }

  if (parts[0] === "candidate" && parts[1]) {
    const id = decodeURIComponent(parts[1]);
    // Untrusted input: reject anything that isn't a well-formed candidate id
    // before it can reach the filesystem (path-traversal guard).
    if (!isValidId(id)) return send(res, 404, "text/html; charset=utf-8", renderNotFound());
    const loc = candidateLocation(cfg, id);

    if (req.method === "GET" && parts.length === 2) {
      // Truly unknown → bounce to the landing page; decided → status page.
      if (!loc) {
        res.writeHead(303, { Location: "/" });
        res.end();
        return;
      }
      const meta = JSON.parse(readFileSync(join(loc.dir, "meta.json"), "utf8")) as GeneratedMeta;
      const verdict = JSON.parse(readFileSync(join(loc.dir, "jury.json"), "utf8")) as JuryVerdict;
      const motivation = readFileSync(join(loc.dir, "motivation.md"), "utf8");
      const html =
        loc.status === "pending"
          ? renderCandidate(id, meta, verdict, motivation)
          : renderResolved(id, meta, verdict, loc.status, motivation);
      return send(res, 200, "text/html; charset=utf-8", html);
    }

    if (req.method === "GET" && parts[2] === "work") {
      const work = loc ? join(loc.dir, "index.html") : null;
      if (!work || !existsSync(work)) return send(res, 404, "text/html; charset=utf-8", renderNotFound());
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": WORK_CSP });
      res.end(readFileSync(work, "utf8"));
      return;
    }

    if (req.method === "POST" && (parts[2] === "approve" || parts[2] === "reject")) {
      const decision: Decision = parts[2] === "approve" ? "approve" : "reject";
      try {
        await decide(id, decision);
        res.writeHead(303, { Location: "/" });
        res.end();
      } catch (err) {
        send(res, 409, "text/html; charset=utf-8", renderNotFound());
      }
      return;
    }
  }

  send(res, 404, "text/html; charset=utf-8", renderNotFound());
}

export function startDashboard(): ReturnType<typeof createServer> {
  const cfg = loadConfig();
  const server = createServer((req, res) => {
    handle(req, res, cfg).catch((err) => send(res, 500, "text/plain", `Error: ${err.message}`));
  });
  server.listen(cfg.dashboard.port, "0.0.0.0", () => {
    const host = cfg.dashboard.tailnetHost || "localhost";
    console.log(`[dashboard] http://${host}:${cfg.dashboard.port}`);
  });
  return server;
}

// CLI: `npm run dashboard`
if (import.meta.url === `file://${process.argv[1]}`) {
  startDashboard();
}
