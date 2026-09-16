import { z } from "zod";
import { loadConfig } from "./config.ts";
import { loadDna } from "./dna.ts";
import { catalogueDigest } from "./catalogue.ts";
import type { GeneratedFiles } from "./generator.ts";

// ── DNA §8.2 scoring weights (max weighted = 5×(3+3+2+1+1) = 50) ─────────────
export const WEIGHTS = { novelty: 3, nuance: 3, narrative: 2, craft: 1, wit: 1 } as const;
export const MAX_WEIGHTED = 50;
export const GATE_IDS = ["G1", "G2", "G3", "G4", "G5", "G6"] as const;

// ── What we ask the model to return (it judges; it does NOT do the math) ─────
const score = z.number().int().min(0).max(5);
const ScoreNotesSchema = z.object({
  novelty: z.string(),
  nuance: z.string(),
  narrative: z.string(),
  craft: z.string(),
  wit: z.string(),
});
export type ScoreNotes = z.infer<typeof ScoreNotesSchema>;
const JuryModelSchema = z.object({
  gates: z.object({
    G1: z.boolean(),
    G2: z.boolean(),
    G3: z.boolean(),
    G4: z.boolean(),
    G5: z.boolean(),
    G6: z.boolean(),
  }),
  // One sentence per criterion, produced BEFORE the number it justifies (see
  // buildJuryTask). Optional so pre-anchor jury.json files still parse.
  score_notes: ScoreNotesSchema.optional(),
  scores: z.object({
    novelty: score,
    nuance: score,
    narrative: score,
    craft: score,
    wit: score,
  }),
  references_named: z.array(z.string()),
  principles_invoked: z.array(z.string()),
  rationale: z.string(),
  reservations: z.string().nullable(),
  revision_suggestion: z.string().nullable(),
});
export type JuryModelResponse = z.infer<typeof JuryModelSchema>;

export type Verdict = "strong" | "borderline" | "reject";

// ── Final verdict object (DNA §8.4 shape; weighted_total + verdict computed) ──
export interface JuryVerdict {
  work_id: string;
  gates: JuryModelResponse["gates"];
  scores: JuryModelResponse["scores"];
  score_notes?: ScoreNotes;
  weighted_total: number;
  verdict: Verdict;
  references_named: string[];
  principles_invoked: string[];
  rationale: string;
  reservations: string | null;
  revision_suggestion: string | null;
  jury_model: string;
}

// ── Deterministic gate/score logic (pure, testable) ──────────────────────────
export function computeWeightedTotal(scores: JuryModelResponse["scores"]): number {
  return (
    scores.novelty * WEIGHTS.novelty +
    scores.nuance * WEIGHTS.nuance +
    scores.narrative * WEIGHTS.narrative +
    scores.craft * WEIGHTS.craft +
    scores.wit * WEIGHTS.wit
  );
}

export function allGatesPass(gates: JuryModelResponse["gates"]): boolean {
  return GATE_IDS.every((g) => gates[g]);
}

/**
 * DNA §8.1/§8.3: any hard-gate failure ⇒ reject regardless of score. Otherwise
 * threshold on the weighted total. Thresholds come from config.
 */
export function deriveVerdict(
  gates: JuryModelResponse["gates"],
  weightedTotal: number,
  thresholds: { strong: number; borderline: number },
): Verdict {
  if (!allGatesPass(gates)) return "reject";
  if (weightedTotal >= thresholds.strong) return "strong";
  if (weightedTotal >= thresholds.borderline) return "borderline";
  return "reject";
}

export function assembleVerdict(
  workId: string,
  model: JuryModelResponse,
  juryModel: string,
  thresholds: { strong: number; borderline: number },
): JuryVerdict {
  const weighted_total = computeWeightedTotal(model.scores);
  return {
    work_id: workId,
    gates: model.gates,
    scores: model.scores,
    ...(model.score_notes ? { score_notes: model.score_notes } : {}),
    weighted_total,
    verdict: deriveVerdict(model.gates, weighted_total, thresholds),
    references_named: model.references_named,
    principles_invoked: model.principles_invoked,
    rationale: model.rationale,
    reservations: model.reservations,
    revision_suggestion: model.revision_suggestion,
    jury_model: juryModel,
  };
}

// ── Prompt construction (pure, testable) ─────────────────────────────────────
export function buildJurySystemAppend(dna: string): string {
  return [
    "You are the JURY agent described in section 0 (role 2) of the artistic DNA below.",
    "Apply the validation rubric in section 8 strictly. Judge the candidate on its own",
    "merits against this DNA — do not be generous. You did not make this work.",
    "",
    "--- ARTISTIC DNA ---",
    dna,
  ].join("\n");
}


// ── Scoring anchors (calibration for §8.2) ───────────────────────────────────
// Over the first 144 juried works, 38% scored exactly 4/4/4/4/4 (= 40/50) and
// each criterion was a 4 in 70–80% of cases, while the written rationale for
// those same works named clear differences in novelty, craft and wit. The model
// discriminates in prose but collapses to "4" when it emits a number. These
// anchors, plus the note-before-number output order in buildJuryTask, make the
// number follow the reasoning. The harness still does all the arithmetic.
export const SCORING_ANCHORS = `SCORING ANCHORS (apply per criterion; 3 is the ordinary score for a competent work)
General: 0 absent · 1 weak · 2 below the catalogue's standard · 3 competent, what the DNA expects by default · 4 clearly better than the catalogue median — you can name the exact feature that earns the extra point · 5 exceptional, a best-in-catalogue example; rare.

Novelty (x3): 1 rehashes a catalogued mechanism or a known net-art trope · 2 a familiar web mechanism with a new label · 3 a fresh found-object OR a fresh mechanism, but the pairing has been seen · 4 a new found-object and mechanism the catalogue lacks, and only the web/AI could do it · 5 opens a location or ontology the catalogue has never touched.
Nuance (x3): 1 idea explained by wall text · 2 concept and execution sit side by side · 3 concept = execution, single reading · 4 double-coded (surface joke + literate reading) with restraint, nothing on the page explains the joke · 5 every element carries both readings; removing anything would break it.
Narrative (x2): 1 no lineage · 2 a name-drop · 3 a named prior work, stated rather than enacted · 4 answers the prior work and sits legibly on the chance/order axis · 5 extends the twenty-year argument with a move it did not have before.
Craft (x1): 1 broken or bloated · 2 works but carries unused code, decoration, or a fallback that apologises · 3 clean, slightly more than needed · 4 the smallest build that completes the thought · 5 nothing to remove, nothing to add, and the code itself is part of the idea.
Wit (x1): 1 no humour or forced · 2 the joke needs the label · 3 the joke lands once · 4 the joke lands on the surface and again on re-reading · 5 the humour IS the mechanism.

Calibration rules:
- Write the note first, then the number; the number must be the one the note describes.
- A criterion you raise a reservation about cannot score 5 and normally does not score 4.
- Giving all five criteria the same score is almost always a failure to discriminate; if you do it, the notes must justify it.
- Do not default to 4. A competent work that does nothing exceptional on a criterion is a 3.
- Use the full scale: 2s and 5s exist. Half the catalogue cannot be "clearly better than the catalogue median".`;

export function buildJuryTask(files: GeneratedFiles, digest: string): string {
  return `Judge the candidate work below against DNA section 8.

${SCORING_ANCHORS}

Return ONLY a JSON object (no prose, no markdown fences) with exactly these keys, in this order:
{
  "gates": {"G1": bool, "G2": bool, "G3": bool, "G4": bool, "G5": bool, "G6": bool},
  "score_notes": {"novelty": "one sentence naming the feature that earns or costs the point", "nuance": "...", "narrative": "...", "craft": "...", "wit": "..."},
  "scores": {"novelty": 0-5, "nuance": 0-5, "narrative": 0-5, "craft": 0-5, "wit": 0-5},
  "references_named": string[],
  "principles_invoked": string[],
  "rationale": "2-4 sentences",
  "reservations": string | null,
  "revision_suggestion": string | null
}

Apply the hard gates (§8.1) first; a single gate failure means the work fails regardless of score. Then, for each criterion, write its score_note against the anchors above and only then pick the number the note describes. Do NOT compute a total or verdict — only provide gates, notes, scores, and remarks.

The work must be materially distinct (G6) from every catalogued work:
${digest}

=== CANDIDATE meta.json ===
${JSON.stringify(files.meta, null, 2)}

=== CANDIDATE motivation.md ===
${files.motivation}

=== CANDIDATE index.html ===
${files.html}`;
}

// ── JSON extraction (pure, testable) ─────────────────────────────────────────
/** Strip markdown fences / surrounding prose and parse the first JSON object. */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1]! : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in jury response");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

export function parseJuryModelResponse(text: string): JuryModelResponse {
  return JuryModelSchema.parse(extractJson(text));
}

// ── OpenRouter call (integration) ────────────────────────────────────────────
export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

async function callOpenRouter(
  system: string,
  user: string,
  model: string,
): Promise<{ content: string; usage: Usage }> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is required for the jury (see .env.example).");
  }
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://y-a-v-a.org",
      "X-Title": "vana jury",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: Partial<Usage>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned no content");
  return {
    content,
    usage: {
      prompt_tokens: data.usage?.prompt_tokens ?? 0,
      completion_tokens: data.usage?.completion_tokens ?? 0,
    },
  };
}

/** Grade a candidate. Returns the §8.4 verdict plus token usage for the fuse. */
export async function juryCandidate(
  workId: string,
  files: GeneratedFiles,
): Promise<{ verdict: JuryVerdict; usage: Usage }> {
  const cfg = loadConfig();
  const { content, usage } = await callOpenRouter(
    buildJurySystemAppend(loadDna()),
    buildJuryTask(files, catalogueDigest()),
    cfg.models.jury,
  );
  const model = parseJuryModelResponse(content);
  const verdict = assembleVerdict(workId, model, cfg.models.jury, cfg.thresholds);
  return { verdict, usage };
}
