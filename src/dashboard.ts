import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadConfig, type Config } from "./config.ts";
import type { GeneratedMeta } from "./generator.ts";
import type { JuryVerdict } from "./jury.ts";
import { isValidId } from "./ids.ts";
import { decide, type Decision } from "./promote.ts";
import { runRefine, isRefining, markRefining } from "./refine.ts";
import { listOrphans, readOrphanRecord, rejuryOrphan, type OrphanItem } from "./orphans.ts";

// The refiner is injectable so tests can stub it (a real refine drives Opus).
let refiner: (id: string, feedback: string) => Promise<void> = runRefine;
export function setRefiner(fn: (id: string, feedback: string) => Promise<void>): void {
  refiner = fn;
}

// Likewise the re-jury (a real one calls the jury provider and spends money).
let rejurier: (id: string) => Promise<unknown> = rejuryOrphan;
export function setRejurier(fn: (id: string) => Promise<unknown>): void {
  rejurier = fn;
}

// The decider (approve/reject) is injectable too, for hermetic route tests.
type Decider = (id: string, decision: Decision, opts?: { push?: boolean; note?: string }) => Promise<unknown>;
let decider: Decider = decide;
export function setDecider(fn: Decider): void {
  decider = fn;
}

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

/** Parse an application/x-www-form-urlencoded body (pure, testable). */
export function parseFormBody(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of raw.split("&")) {
    if (!pair) continue;
    const eq = pair.indexOf("=");
    const rawKey = eq < 0 ? pair : pair.slice(0, eq);
    const rawVal = eq < 0 ? "" : pair.slice(eq + 1);
    try {
      out[decodeURIComponent(rawKey.replace(/\+/g, " "))] = decodeURIComponent(
        rawVal.replace(/\+/g, " "),
      );
    } catch {
      // skip a malformed pair
    }
  }
  return out;
}

const STYLE = `
  :root{
    --ink:#1a1a1a;--muted:#4a4a4a;--line:#d6d2c6;--paper:#f4f1e9;--card:#fff;--well:#faf8f2;
    --accent:#002fa7;--on-accent:#fff;
    --ok:#166b32;--warn:#7a5a06;--bad:#9a1f1f;--neutral:#3d3d3d;--on-badge:#fff;
    --btn-bg:#fff;--btn-ink:var(--ink);
  }
  @media (prefers-color-scheme: dark){
    :root{
      --ink:#ece8dc;--muted:#b9b3a4;--line:#3b3930;--paper:#161511;--card:#1f1e18;--well:#181712;
      --accent:#8fb0ff;--on-accent:#0c1230;
      --ok:#3fae62;--warn:#d9a52a;--bad:#e06060;--neutral:#8a8a8a;--on-badge:#111;
      --btn-bg:#1f1e18;--btn-ink:var(--ink);
    }
  }
  *{box-sizing:border-box}
  html{font-size:16px}
  @media (max-width:640px){html{font-size:19.2px}}
  body{margin:0;background:var(--paper);color:var(--ink);font:1rem/1.5 Georgia,serif}
  header{padding:1.2rem 1.5rem;border-bottom:1px solid var(--line)}
  a{color:var(--accent)}
  header a{text-decoration:none}
  main{max-width:60rem;margin:0 auto;padding:1.5rem}
  .badge{display:inline-block;padding:.1rem .5rem;border-radius:.2rem;font:600 .8125rem/1.4 monospace;color:var(--on-badge)}
  .strong{background:var(--ok)}.borderline{background:var(--warn)}.reject{background:var(--bad)}
  .card{border:1px solid var(--line);border-radius:.4rem;padding:1rem 1.2rem;margin:1rem 0;background:var(--card)}
  .muted{color:var(--muted)}
  .scores{font:.8125rem/1.6 monospace}
  .notes{font-size:.8125rem;padding-left:1.2rem}
  /* The work is a separate document; keep its frame light and opaque so the
     gateway's dark theme never leaks into (or shows through) the artwork. */
  iframe{width:100%;height:60vh;border:1px solid var(--line);border-radius:.4rem;background:#fff;color-scheme:light}
  pre{white-space:pre-wrap;font:.875rem/1.55 Georgia,serif;background:var(--well);padding:1rem;border-radius:.3rem}
  form{display:inline}
  button{font:600 .9375rem/1 Georgia,serif;padding:.6rem 1.4rem;border-radius:.3rem;border:1px solid var(--line);cursor:pointer;background:var(--btn-bg);color:var(--btn-ink)}
  .approve{background:var(--ok);color:var(--on-badge);border-color:var(--ok)}
  .rejectbtn{background:var(--btn-bg);color:var(--bad);border-color:var(--bad);margin-left:.5rem}
  label{display:block;font:600 .875rem/1.4 Georgia,serif;margin-bottom:.35rem}
  textarea{width:100%;font:.875rem/1.5 Georgia,serif;padding:.6rem;border:1px solid var(--line);border-radius:.3rem;margin-bottom:.6rem;resize:vertical;background:var(--card);color:var(--ink)}
  .refinebtn{background:var(--accent);color:var(--on-accent);border-color:var(--accent)}
  .orphan{background:var(--neutral)}
  .rejurybtn{background:var(--neutral);color:var(--on-badge);border-color:var(--neutral)}
  .err{font:.8125rem/1.5 monospace;color:var(--bad);word-break:break-word}
  h2.section{margin-top:2.5rem;border-top:1px solid var(--line);padding-top:1.5rem}
`;

function shell(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${escapeHtml(title)}</title><style>${STYLE}</style></head>
<body><header><a href="/">vana</a> · approval gateway</header><main>${body}</main></body></html>`;
}

/** The orphan section of the landing page — omitted entirely when there are none. */
function orphanSection(orphans: OrphanItem[]): string {
  if (orphans.length === 0) return "";
  const rows = orphans
    .map(
      (it) => `<div class="card">
  <a href="/orphan/${encodeURIComponent(it.id)}"><strong>${escapeHtml(it.meta.title)}</strong></a>
  <span class="badge orphan">no verdict</span>
  <div class="muted">${escapeHtml(it.meta.summary)}</div>
  <p class="err">${escapeHtml(it.orphan?.error ?? "stranded (no record)")}</p>
</div>`,
    )
    .join("\n");
  return `<h2 class="section">Orphaned (${orphans.length})</h2>
<p class="muted">Finished works the jury never graded. Re-jury one to send it back through the gate.</p>
${rows}`;
}

export function renderIndex(items: PendingItem[], orphans: OrphanItem[] = []): string {
  const rows = items
    .map(
      (it) => `<div class="card">
  <a href="/candidate/${encodeURIComponent(it.id)}"><strong>${escapeHtml(it.meta.title)}</strong></a>
  <span class="badge ${it.verdict.verdict}">${it.verdict.verdict} ${it.verdict.weighted_total}/50</span>
  <div class="muted">${escapeHtml(it.meta.summary)}</div>
</div>`,
    )
    .join("\n");
  const pending =
    items.length === 0
      ? `<p class="muted">No candidates awaiting confirmation.</p>`
      : `<h1>Pending (${items.length})</h1>${rows}`;
  return shell("vana · pending", `${pending}${orphanSection(orphans)}`);
}

/** A stranded work: the work itself, why it never got a verdict, and a re-jury button. */
export function renderOrphan(
  id: string,
  meta: GeneratedMeta,
  orphan: OrphanItem["orphan"],
  motivation: string,
): string {
  const enc = encodeURIComponent(id);
  const body = `
  <h1>${escapeHtml(meta.title)} <span class="badge orphan">no verdict</span></h1>
  <p>${escapeHtml(meta.summary)}</p>
  <div class="card">
    <strong>This work was never graded.</strong>
    <p class="err">${escapeHtml(orphan?.error ?? "stranded (no record)")}</p>
    <p class="muted">Stranded ${escapeHtml(orphan?.at ?? "at an unknown time")} · generation cost $${orphan?.costUsd?.toFixed(2) ?? "?"}${
      orphan?.violations?.length
        ? ` · <strong>self-containment violations:</strong> ${escapeHtml(orphan.violations.join("; "))}`
        : ""
    }</p>
  </div>
  <iframe src="/orphan/${enc}/work" title="work" sandbox="allow-scripts allow-downloads" referrerpolicy="no-referrer"></iframe>
  <div class="card">
    <form method="POST" action="/orphan/${enc}/rejury">
      <label>Re-jury — grade it now and send it to pending for your decision</label>
      <button class="rejurybtn" type="submit">Re-jury →</button>
    </form>
  </div>
  <h2>Motivation</h2>
  <pre>${escapeHtml(motivation)}</pre>`;
  return shell(`vana · ${meta.title}`, body);
}

/** Per-criterion notes (present on verdicts juried with scoring anchors). */
function scoreNotes(verdict: JuryVerdict): string {
  const n = verdict.score_notes;
  if (!n) return "";
  const items = (["novelty", "nuance", "narrative", "craft", "wit"] as const)
    .map((k) => `<li><strong>${k} ${verdict.scores[k]}</strong> — ${escapeHtml(n[k])}</li>`)
    .join("");
  return `<ul class="muted notes">${items}</ul>`;
}

/** The work iframe + jury card, shared by the pending and resolved views. */
function workAndJury(id: string, meta: GeneratedMeta, verdict: JuryVerdict): string {
  const s = verdict.scores;
  return `
  <iframe src="/candidate/${encodeURIComponent(id)}/work" title="work" sandbox="allow-scripts allow-downloads" referrerpolicy="no-referrer"></iframe>
  <div class="card">
    <div class="scores">novelty ${s.novelty} · nuance ${s.nuance} · narrative ${s.narrative} · craft ${s.craft} · wit ${s.wit}</div>
    ${scoreNotes(verdict)}
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
  refining = false,
): string {
  const enc = encodeURIComponent(id);
  const actions = refining
    ? `<div class="card"><strong>Refining…</strong> the agent is reworking this candidate from your feedback. You'll be emailed when it's ready — reload to check.</div>`
    : `<div class="card">
    <form method="POST" action="/candidate/${enc}/approve"><button class="approve" type="submit">Approve → publish</button></form>
  </div>
  <div class="card">
    <form method="POST" action="/candidate/${enc}/reject">
      <label for="note">Reject — optional note (the agent learns from it next round)</label>
      <textarea id="note" name="note" rows="2" placeholder="e.g. too reverent — I want more bite in the market critique"></textarea>
      <button class="rejectbtn" type="submit">Reject</button>
    </form>
  </div>
  <div class="card">
    <form method="POST" action="/candidate/${enc}/refine">
      <label for="feedback">Refine — tell the agent what to change</label>
      <textarea id="feedback" name="feedback" rows="3" required placeholder="e.g. the canvas throws a TypeError on click — fix it; and raise the contrast"></textarea>
      <button class="refinebtn" type="submit">Refine →</button>
    </form>
  </div>`;
  const body = `
  <h1>${escapeHtml(meta.title)} <span class="badge ${verdict.verdict}">${verdict.verdict} ${verdict.weighted_total}/50</span></h1>
  <p>${escapeHtml(meta.summary)}</p>
  ${workAndJury(id, meta, verdict)}
  ${actions}
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

async function readBody(req: IncomingMessage, limit = 64 * 1024): Promise<string> {
  let data = "";
  for await (const chunk of req) {
    data += chunk;
    if (data.length > limit) throw new Error("request body too large");
  }
  return data;
}

/**
 * Stale links (Safari history, old emails) still point at `http://<tailnetHost>:4737`,
 * which Safari won't submit a form over. When `dashboard.baseUrl` is configured, send
 * those to the HTTPS origin `tailscale serve` terminates for us.
 *
 * Requests arriving *through* that proxy carry `x-forwarded-proto: https` and must pass
 * through untouched, or we'd loop. Loopback hosts are left alone too, so local tooling
 * (ops/status.sh, health checks) keeps seeing a plain 200.
 */
export function httpsRedirectTarget(
  cfg: Config,
  req: Pick<IncomingMessage, "method" | "url" | "headers">,
): string | null {
  const base = cfg.dashboard.baseUrl?.replace(/\/+$/, "");
  if (!base) return null;
  if (req.method !== "GET" && req.method !== "HEAD") return null;
  if (req.headers["x-forwarded-proto"]) return null;
  const host = (req.headers.host ?? "").replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host === "127.0.0.1" || host === "::1") return null;
  return `${base}${req.url ?? "/"}`;
}

export async function handle(req: IncomingMessage, res: ServerResponse, cfg: Config): Promise<void> {
  const redirect = httpsRedirectTarget(cfg, req);
  if (redirect) {
    res.writeHead(301, { location: redirect });
    return void res.end();
  }

  const url = new URL(req.url ?? "/", "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean); // e.g. ["candidate","<id>","work"]

  if (req.method === "GET" && parts.length === 0) {
    return send(res, 200, "text/html; charset=utf-8", renderIndex(listPending(cfg), listOrphans(cfg)));
  }

  if (parts[0] === "orphan" && parts[1]) {
    const id = decodeURIComponent(parts[1]);
    if (!isValidId(id)) return send(res, 404, "text/html; charset=utf-8", renderNotFound());
    const dir = join(cfg.abs.orphaned, id);
    if (!existsSync(dir)) return send(res, 404, "text/html; charset=utf-8", renderNotFound());

    if (req.method === "GET" && parts.length === 2) {
      const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8")) as GeneratedMeta;
      const motivation = readFileSync(join(dir, "motivation.md"), "utf8");
      const html = renderOrphan(id, meta, readOrphanRecord(dir), motivation);
      return send(res, 200, "text/html; charset=utf-8", html);
    }

    if (req.method === "GET" && parts[2] === "work") {
      const work = join(dir, "index.html");
      if (!existsSync(work)) return send(res, 404, "text/html; charset=utf-8", renderNotFound());
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": WORK_CSP });
      res.end(readFileSync(work, "utf8"));
      return;
    }

    if (req.method === "POST" && parts[2] === "rejury") {
      // Fire and forget, like refine: the jury call takes seconds and the lock
      // serializes it against a running wake. Landing page shows the result.
      void rejurier(id).catch((err) => console.error(`[rejury] ${id}: ${(err as Error).message}`));
      res.writeHead(303, { Location: "/" });
      return void res.end();
    }
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
          ? renderCandidate(id, meta, verdict, motivation, isRefining(loc.dir))
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
      let note: string | undefined;
      if (decision === "reject") {
        try {
          note = parseFormBody(await readBody(req)).note?.trim() || undefined;
        } catch {
          note = undefined; // oversized/garbled body → reject without a note
        }
      }
      try {
        await decider(id, decision, note ? { note } : {});
        res.writeHead(303, { Location: "/" });
        res.end();
      } catch (err) {
        send(res, 409, "text/html; charset=utf-8", renderNotFound());
      }
      return;
    }

    if (req.method === "POST" && parts[2] === "refine") {
      const back = { Location: `/candidate/${encodeURIComponent(id)}` };
      if (!loc || loc.status !== "pending") return send(res, 409, "text/html; charset=utf-8", renderNotFound());
      if (isRefining(loc.dir)) {
        res.writeHead(303, back);
        return void res.end();
      }
      let feedback: string;
      try {
        feedback = (parseFormBody(await readBody(req)).feedback ?? "").trim();
      } catch {
        return send(res, 413, "text/html; charset=utf-8", renderNotFound());
      }
      if (!feedback) {
        res.writeHead(303, back);
        return void res.end();
      }
      try {
        markRefining(loc.dir, feedback, new Date()); // exclusive; throws if one is in flight
      } catch {
        res.writeHead(303, back);
        return void res.end();
      }
      void refiner(id, feedback).catch((err) => console.error(`[refine] ${id}: ${(err as Error).message}`));
      res.writeHead(303, back);
      return void res.end();
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
