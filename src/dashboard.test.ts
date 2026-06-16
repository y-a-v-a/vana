import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, renderIndex, renderCandidate, type PendingItem } from "./dashboard.ts";
import { statusFor } from "./promote.ts";
import type { GeneratedMeta } from "./generator.ts";
import type { JuryVerdict } from "./jury.ts";

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

test("statusFor maps approve→published / reject→rejected", () => {
  assert.deepEqual(statusFor("approve"), { status: "published", verb: "publish" });
  assert.deepEqual(statusFor("reject"), { status: "rejected", verb: "reject" });
});
