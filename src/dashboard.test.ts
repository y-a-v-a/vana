import { test } from "node:test";
import assert from "node:assert/strict";
import {
  escapeHtml,
  parseFormBody,
  renderIndex,
  paginate,
  renderCandidate,
  renderResolved,
  renderNotFound,
  renderOrphan,
  httpsRedirectTarget,
  type PendingItem,
} from "./dashboard.ts";
import type { OrphanItem } from "./orphans.ts";
import { statusFor } from "./promote.ts";
import type { GeneratedMeta } from "./generator.ts";
import type { JuryVerdict } from "./jury.ts";
import type { Config } from "./config.ts";

const meta: GeneratedMeta = {
  title: "The <Original>",
  summary: "A & B summary",
  mechanism: "blob download",
  principles: ["P1"],
  references: ["Benjamin"],
  license: "CC BY-SA 4.0",
};

const verdict: JuryVerdict = {
  work_id: "x",
  gates: { G1: true, G2: true, G3: true, G4: true, G5: true, G6: true },
  scores: { novelty: 4, nuance: 4, narrative: 4, craft: 4, wit: 4 },
  weighted_total: 40,
  verdict: "strong",
  references_named: ["Benjamin"],
  principles_invoked: ["P1", "P6"],
  rationale: "Rationale text",
  reservations: null,
  revision_suggestion: null,
  jury_model: "minimax/minimax-m3",
};

test("escapeHtml neutralizes angle brackets, amp, quote", () => {
  assert.equal(escapeHtml('<a href="x">&'), "&lt;a href=&quot;x&quot;&gt;&amp;");
});

test("renderIndex shows empty-state when nothing pending", () => {
  assert.match(renderIndex([]), /No candidates awaiting confirmation/);
});

test("paginate slices 1-based pages and clamps malformed or out-of-range pages", () => {
  const xs = Array.from({ length: 25 }, (_, i) => i + 1);
  assert.deepEqual(paginate(xs, 1), { items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], page: 1, pages: 3 });
  assert.deepEqual(paginate(xs, 3), { items: [21, 22, 23, 24, 25], page: 3, pages: 3 });
  assert.equal(paginate(xs, 99).page, 3); // stale link past the end → last page
  for (const bad of [0, -2, NaN]) assert.equal(paginate(xs, bad).page, 1);
  assert.equal(paginate(xs, 2.7).page, 2);
  assert.deepEqual(paginate(xs.slice(0, 20), 2).items, xs.slice(10, 20)); // exact multiple: no empty page 3
  assert.equal(paginate(xs.slice(0, 20), 3).page, 2);
  assert.deepEqual(paginate([], 4), { items: [], page: 1, pages: 1 });
});

test("renderIndex shows 10 per page with a pager, keeping the full count in the heading", () => {
  const items: PendingItem[] = Array.from({ length: 25 }, (_, i) => ({
    id: `2026-06-${String(i + 1).padStart(2, "0")}-w`,
    meta: { ...meta, title: `Work ${i + 1}` },
    verdict,
  }));
  const html = renderIndex(items, [], 2);
  assert.match(html, /Pending \(25\)/);
  assert.equal(html.match(/<div class="card">/g)?.length, 10);
  assert.match(html, />Work 11</);
  assert.match(html, />Work 20</);
  assert.doesNotMatch(html, />Work 10</);
  assert.doesNotMatch(html, />Work 21</);
  assert.match(html, /<a href="\/" rel="prev">/); // page 1 is the bare landing URL
  assert.match(html, /<a href="\/\?page=3" rel="next">/);
  assert.match(html, /<span aria-current="page">2<\/span>/);
  assert.match(html, /11–20 of 25/);
  assert.match(html, /<title>vana · pending · page 2<\/title>/);

  const last = renderIndex(items, [], 3);
  assert.match(last, /21–25 of 25/);
  assert.doesNotMatch(last, /rel="next"/);
  assert.doesNotMatch(renderIndex(items), /rel="prev"/);
});

test("renderIndex omits the pager when one page holds everything", () => {
  const items: PendingItem[] = Array.from({ length: 10 }, (_, i) => ({ id: `2026-06-1${i}-w`, meta, verdict }));
  assert.doesNotMatch(renderIndex(items), /class="pager"/);
  assert.doesNotMatch(renderIndex([]), /class="pager"/);
});

test("renderIndex lists items with verdict badge and escapes titles", () => {
  const items: PendingItem[] = [{ id: "2026-06-16-x", meta, verdict }];
  const html = renderIndex(items);
  assert.match(html, /Pending \(1\)/);
  assert.match(html, /strong 40\/50/);
  assert.match(html, /The &lt;Original&gt;/); // escaped
  assert.doesNotMatch(html, /The <Original>/);
});

test("renderCandidate embeds work iframe, scores, rationale, and action forms", () => {
  const html = renderCandidate("2026-06-16-x", meta, verdict, "motivation body");
  assert.match(html, /\/candidate\/2026-06-16-x\/work/);
  assert.match(html, /novelty 4 · nuance 4/);
  assert.match(html, /Rationale text/);
  assert.match(html, /action="\/candidate\/2026-06-16-x\/approve"/);
  assert.match(html, /action="\/candidate\/2026-06-16-x\/reject"/);
  assert.match(html, /motivation body/);
});

test("renderCandidate offers the work in a new tab, opened without an opener", () => {
  const html = renderCandidate("2026-06-16-x", meta, verdict, "m");
  assert.match(
    html,
    /<a href="\/candidate\/2026-06-16-x\/work" target="_blank" rel="noopener noreferrer">Open the work in a new tab/,
  );
});

test("renderCandidate action buttons show busy feedback on submit", () => {
  const html = renderCandidate("2026-06-16-x", meta, verdict, "m");
  assert.match(html, /class="approve"[^>]*data-busy="Publishing…"/);
  assert.match(html, /class="rejectbtn"[^>]*data-busy="Rejecting…"/);
  assert.match(html, /class="refinebtn"[^>]*data-busy="[^"]+"/);
  assert.match(html, /addEventListener\("submit"/); // locks buttons + spins the clicked one
  assert.match(html, /button\.busy::before/);
});

test("renderResolved shows published status, work, and no action forms", () => {
  const html = renderResolved("2026-06-16-x", meta, verdict, "published", "motivation body");
  assert.match(html, /Published ✓/);
  assert.match(html, /\/candidate\/2026-06-16-x\/work/); // work still viewable
  assert.match(html, /back to pending/);
  assert.doesNotMatch(html, /action="[^"]*\/approve"/); // no approve/reject buttons
});

test("renderResolved shows rejected status", () => {
  assert.match(renderResolved("id", meta, verdict, "rejected", ""), /Rejected/);
});

test("renderCandidate shows the refine textarea + actions when not refining", () => {
  const html = renderCandidate("2026-06-16-x", meta, verdict, "m");
  assert.match(html, /name="feedback"/);
  assert.match(html, /\/candidate\/2026-06-16-x\/refine/);
  assert.match(html, /Approve/);
});

test("renderCandidate shows 'Refining…' and hides actions while refining", () => {
  const html = renderCandidate("2026-06-16-x", meta, verdict, "m", true);
  assert.match(html, /Refining…/);
  assert.doesNotMatch(html, /name="feedback"/);
  assert.doesNotMatch(html, /\/approve"/);
});

test("renderCandidate reject form has an optional learning note textarea", () => {
  const html = renderCandidate("2026-06-16-x", meta, verdict, "m");
  assert.match(html, /name="note"/);
  assert.match(html, /learns from it next round/);
});

test("parseFormBody decodes urlencoded fields (+ and %)", () => {
  assert.deepEqual(parseFormBody("feedback=fix+the+TypeError%20now&x=1"), {
    feedback: "fix the TypeError now",
    x: "1",
  });
});

test("parseFormBody returns {} for an empty body", () => {
  assert.deepEqual(parseFormBody(""), {});
});

test("renderNotFound links back to the landing page", () => {
  const html = renderNotFound();
  assert.match(html, /Nothing here/);
  assert.match(html, /href="\/"/);
});

test("statusFor maps approve→published / reject→rejected", () => {
  assert.deepEqual(statusFor("approve"), { status: "published", verb: "publish" });
  assert.deepEqual(statusFor("reject"), { status: "rejected", verb: "reject" });
});

// ── orphans ──────────────────────────────────────────────────────────────────

const orphan: OrphanItem = {
  id: "2026-07-27-stranded",
  meta,
  orphan: {
    id: "2026-07-27-stranded",
    at: "2026-07-27T12:00:00.000Z",
    error: "OpenRouter returned no content",
    violations: [],
    costUsd: 1.234,
  },
};

test("renderIndex omits the orphan section when there are none", () => {
  assert.doesNotMatch(renderIndex([]), /Orphaned/);
});

test("renderIndex lists orphans with their stranding error, below pending", () => {
  const html = renderIndex([{ id: "2026-06-16-x", meta, verdict }], [orphan]);
  assert.match(html, /Pending \(1\)/);
  assert.match(html, /Orphaned \(1\)/);
  assert.match(html, /OpenRouter returned no content/);
  assert.match(html, /href="\/orphan\/2026-07-27-stranded"/);
  assert.match(html, /The &lt;Original&gt;/); // still escaped
});

test("renderIndex shows orphans even when nothing is pending", () => {
  const html = renderIndex([], [orphan]);
  assert.match(html, /No candidates awaiting confirmation/);
  assert.match(html, /Orphaned \(1\)/);
});

test("renderOrphan shows the work, the failure, and a re-jury form — no approve/reject", () => {
  const html = renderOrphan(orphan.id, meta, orphan.orphan, "motivation body");
  assert.match(html, /\/orphan\/2026-07-27-stranded\/work/);
  assert.match(html, /action="\/orphan\/2026-07-27-stranded\/rejury"/);
  assert.match(html, /OpenRouter returned no content/);
  assert.match(html, /\$1\.23/); // generation cost already spent
  assert.match(html, /motivation body/);
  assert.doesNotMatch(html, /\/approve"/);
  assert.doesNotMatch(html, /name="feedback"/);
});

test("renderOrphan surfaces self-containment violations when present", () => {
  const html = renderOrphan(orphan.id, meta, { ...orphan.orphan!, violations: ["external src: https://x"] }, "");
  assert.match(html, /self-containment violations/);
  assert.match(html, /external src: https:\/\/x/);
});

test("renderOrphan tolerates a missing orphan record", () => {
  const html = renderOrphan(orphan.id, meta, null, "");
  assert.match(html, /stranded \(no record\)/);
  assert.match(html, /action="\/orphan\/2026-07-27-stranded\/rejury"/);
});

// --- HTTPS redirect for stale plain-HTTP links -------------------------------

const redirCfg = (baseUrl?: string) =>
  ({ dashboard: { port: 4737, tailnetHost: "the-machine.ts.net", baseUrl } }) as Config;

test("httpsRedirectTarget sends a stale tailnet http:// link to the HTTPS origin", () => {
  const target = httpsRedirectTarget(redirCfg("https://the-machine.ts.net"), {
    method: "GET",
    url: "/candidate/w1",
    headers: { host: "the-machine.ts.net:4737" },
  });
  assert.equal(target, "https://the-machine.ts.net/candidate/w1");
});

test("httpsRedirectTarget passes proxied requests through, so serve does not loop", () => {
  const target = httpsRedirectTarget(redirCfg("https://the-machine.ts.net"), {
    method: "GET",
    url: "/",
    headers: { host: "the-machine.ts.net", "x-forwarded-proto": "https" },
  });
  assert.equal(target, null);
});

test("httpsRedirectTarget leaves loopback alone so local tooling still sees 200", () => {
  for (const host of ["localhost:4737", "127.0.0.1:4737"]) {
    const target = httpsRedirectTarget(redirCfg("https://the-machine.ts.net"), {
      method: "GET",
      url: "/",
      headers: { host },
    });
    assert.equal(target, null, host);
  }
});

test("httpsRedirectTarget never redirects a POST, which would drop the approval body", () => {
  const target = httpsRedirectTarget(redirCfg("https://the-machine.ts.net"), {
    method: "POST",
    url: "/candidate/w1/approve",
    headers: { host: "the-machine.ts.net:4737" },
  });
  assert.equal(target, null);
});

test("httpsRedirectTarget is inert when no baseUrl is configured", () => {
  const target = httpsRedirectTarget(redirCfg(), {
    method: "GET",
    url: "/",
    headers: { host: "the-machine.ts.net:4737" },
  });
  assert.equal(target, null);
});

test("gateway theme: dark scheme is scoped to the shell, the work iframe stays light and opaque", () => {
  const html = renderIndex([]);
  assert.match(html, /<meta name="color-scheme" content="light dark">/);
  assert.match(html, /@media \(prefers-color-scheme: dark\)/);
  // the artwork is a separate document; its frame must not inherit the theme
  assert.match(html, /iframe\{[^}]*background:#fff;color-scheme:light[^}]*\}/);
});

test("gateway theme: mobile viewports scale the root font by 20%", () => {
  const html = renderIndex([]);
  assert.match(html, /html\{font-size:16px\}/);
  assert.match(html, /@media \(max-width:640px\)\{html\{font-size:19\.2px\}\}/);
  // every fixed size must be rem-based so the root bump reaches it
  const style = html.slice(html.indexOf("<style>"), html.indexOf("</style>"));
  const pxFonts = style.match(/font(?:-size)?:[^;}]*\b\d+px/g) ?? [];
  assert.deepEqual(pxFonts, ["font-size:16px", "font-size:19.2px"]);
});
