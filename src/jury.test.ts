import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeWeightedTotal,
  allGatesPass,
  deriveVerdict,
  assembleVerdict,
  extractJson,
  repairJsonQuotes,
  parseJuryModelResponse,
  buildJuryTask,
  digestForJury,
  SCORING_ANCHORS,
  MAX_WEIGHTED,
  type JuryModelResponse,
} from "./jury.ts";

const TH = { strong: 38, borderline: 30 };
const PASS_GATES = { G1: true, G2: true, G3: true, G4: true, G5: true, G6: true };

function model(over: Partial<JuryModelResponse> = {}): JuryModelResponse {
  return {
    gates: { ...PASS_GATES },
    scores: { novelty: 5, nuance: 5, narrative: 5, craft: 5, wit: 5 },
    references_named: ["Duchamp"],
    principles_invoked: ["P1"],
    rationale: "ok",
    reservations: null,
    revision_suggestion: null,
    ...over,
  };
}

test("computeWeightedTotal: perfect scores hit the max (50)", () => {
  assert.equal(computeWeightedTotal(model().scores), MAX_WEIGHTED);
  assert.equal(MAX_WEIGHTED, 50);
});

test("computeWeightedTotal: applies §8.2 weights (3/3/2/1/1)", () => {
  const total = computeWeightedTotal({ novelty: 4, nuance: 3, narrative: 2, craft: 1, wit: 0 });
  assert.equal(total, 4 * 3 + 3 * 3 + 2 * 2 + 1 * 1 + 0); // 12+9+4+1 = 26
});

test("allGatesPass requires every gate", () => {
  assert.equal(allGatesPass(PASS_GATES), true);
  assert.equal(allGatesPass({ ...PASS_GATES, G4: false }), false);
});

test("deriveVerdict: any gate failure rejects regardless of score", () => {
  assert.equal(deriveVerdict({ ...PASS_GATES, G1: false }, 50, TH), "reject");
});

test("deriveVerdict: thresholds strong/borderline/reject", () => {
  assert.equal(deriveVerdict(PASS_GATES, 38, TH), "strong");
  assert.equal(deriveVerdict(PASS_GATES, 37, TH), "borderline");
  assert.equal(deriveVerdict(PASS_GATES, 30, TH), "borderline");
  assert.equal(deriveVerdict(PASS_GATES, 29, TH), "reject");
});

test("assembleVerdict computes total + verdict and preserves notes", () => {
  const v = assembleVerdict("2026-06-16-x", model(), "openai/gpt-4o", TH);
  assert.equal(v.weighted_total, 50);
  assert.equal(v.verdict, "strong");
  assert.equal(v.work_id, "2026-06-16-x");
  assert.equal(v.jury_model, "openai/gpt-4o");
  assert.deepEqual(v.references_named, ["Duchamp"]);
});

test("assembleVerdict: gate fail overrides a high score", () => {
  const v = assembleVerdict("id", model({ gates: { ...PASS_GATES, G6: false } }), "m", TH);
  assert.equal(v.weighted_total, 50);
  assert.equal(v.verdict, "reject");
});

test("extractJson handles bare JSON", () => {
  assert.deepEqual(extractJson('{"a":1}'), { a: 1 });
});

test("extractJson handles fenced JSON with prose", () => {
  const text = "Here is my verdict:\n```json\n{\"a\": 2}\n```\nDone.";
  assert.deepEqual(extractJson(text), { a: 2 });
});

test("extractJson handles surrounding prose without fences", () => {
  assert.deepEqual(extractJson('verdict: {"a":3} thanks'), { a: 3 });
});

test("extractJson throws when no object present", () => {
  assert.throws(() => extractJson("no json here"));
});

test("parseJuryModelResponse validates a full model reply", () => {
  const raw = JSON.stringify(model());
  const parsed = parseJuryModelResponse(raw);
  assert.equal(parsed.scores.novelty, 5);
});

test("parseJuryModelResponse accepts and preserves score_notes", () => {
  const notes = {
    novelty: "new found-object",
    nuance: "double-coded",
    narrative: "answers Anastasi",
    craft: "smallest build",
    wit: "lands twice",
  };
  const parsed = parseJuryModelResponse(JSON.stringify({ ...model(), score_notes: notes }));
  assert.deepEqual(parsed.score_notes, notes);
  const v = assembleVerdict("id", parsed, "m", TH);
  assert.deepEqual(v.score_notes, notes);
});

test("parseJuryModelResponse rejects score_notes missing a criterion", () => {
  const bad = JSON.stringify({ ...model(), score_notes: { novelty: "only one" } });
  assert.throws(() => parseJuryModelResponse(bad));
});

test("assembleVerdict omits score_notes when the model gave none (old jury.json shape)", () => {
  const v = assembleVerdict("id", model(), "m", TH);
  assert.equal("score_notes" in v, false);
});

test("parseJuryModelResponse rejects out-of-range scores", () => {
  const bad = JSON.stringify(model({ scores: { novelty: 9, nuance: 0, narrative: 0, craft: 0, wit: 0 } }));
  assert.throws(() => parseJuryModelResponse(bad));
});

test("buildJuryTask embeds candidate html, motivation, and meta", () => {
  const files = {
    html: "<h1>UNIQUE_MARKER_HTML</h1>",
    motivation: "UNIQUE_MARKER_MOTIVATION",
    meta: {
      title: "T",
      summary: "s",
      mechanism: "m",
      principles: ["P1"],
      references: ["R"],
      license: "CC BY-SA 4.0",
    },
  };
  const task = buildJuryTask(files, "- A Catalogued Work");
  assert.match(task, /UNIQUE_MARKER_HTML/);
  assert.match(task, /UNIQUE_MARKER_MOTIVATION/);
  assert.match(task, /A Catalogued Work/);
  assert.match(task, /"G1"/);
});

test("buildJuryTask embeds the scoring anchors and asks for notes before numbers", () => {
  const files = {
    html: "<p>x</p>",
    motivation: "m",
    meta: { title: "T", summary: "s", mechanism: "m", principles: ["P1"], references: ["R"], license: "CC BY-SA 4.0" },
  };
  const task = buildJuryTask(files, "- A");
  assert.ok(task.includes(SCORING_ANCHORS));
  assert.match(SCORING_ANCHORS, /Do not default to 4/);
  const notesAt = task.indexOf('"score_notes"');
  const scoresAt = task.indexOf('"scores"');
  assert.ok(notesAt > -1 && scoresAt > -1 && notesAt < scoresAt, "score_notes must precede scores");
});

test("digestForJury drops the work's own catalogue entry (refine / re-jury must not self-duplicate)", () => {
  const entries = [
    { id: "2026-06-16-the-original", title: "The Original", year: 2026, source: "Benjamin", mechanism: "blob", status: "published" as const },
    { id: "other", title: "Other", year: 2026, source: "s", mechanism: "m", status: "pending" as const },
  ];
  const digest = digestForJury("2026-06-16-the-original", entries);
  assert.doesNotMatch(digest, /The Original/);
  assert.match(digest, /Other/);
});

test("repairJsonQuotes escapes a bare inner quote but leaves real terminators alone", () => {
  const raw = `{"a":"Cage's 4'33" and more","b":"x" , "c":["y"],"d":{"e":"f"}}`;
  assert.deepEqual(JSON.parse(repairJsonQuotes(raw)), { a: `Cage's 4'33" and more`, b: "x", c: ["y"], d: { e: "f" } });
});

test("repairJsonQuotes leaves already-escaped quotes and valid JSON untouched", () => {
  const valid = JSON.stringify({ a: 'say "hi"', b: 1, c: [true, null] });
  assert.equal(repairJsonQuotes(valid), valid);
});

test("extractJson falls back to quote repair on a model reply with an unescaped inner quote", () => {
  const reply = `{"gates":{"G1":true},"score_notes":{"novelty":"A fresh found-object (Cage's 4'33") and a mechanism."},"scores":{"novelty":4}}`;
  assert.throws(() => JSON.parse(reply));
  const parsed = extractJson(reply) as { score_notes: { novelty: string }; scores: { novelty: number } };
  assert.equal(parsed.score_notes.novelty, `A fresh found-object (Cage's 4'33") and a mechanism.`);
  assert.equal(parsed.scores.novelty, 4);
});

test("extractJson still throws the original error when repair cannot help", () => {
  assert.throws(() => extractJson("{not json at all}"));
});
