import { test } from "node:test";
import assert from "node:assert/strict";
import {
  escapeHtml,
  parseFormBody,
  renderIndex,
  renderCandidate,
  renderResolved,
  renderNotFound,
  type PendingItem,
} from "./dashboard.ts";
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
