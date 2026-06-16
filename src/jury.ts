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
const JuryModelSchema = z.object({
  gates: z.object({
    G1: z.boolean(),
    G2: z.boolean(),
    G3: z.boolean(),
    G4: z.boolean(),
    G5: z.boolean(),
    G6: z.boolean(),
  }),
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

export function buildJuryTask(files: GeneratedFiles, digest: string): string {
  return `Judge the candidate work below against DNA section 8.

Return ONLY a JSON object (no prose, no markdown fences) with exactly these keys:
{
  "gates": {"G1": bool, "G2": bool, "G3": bool, "G4": bool, "G5": bool, "G6": bool},
  "scores": {"novelty": 0-5, "nuance": 0-5, "narrative": 0-5, "craft": 0-5, "wit": 0-5},
  "references_named": string[],
  "principles_invoked": string[],
  "rationale": "2-4 sentences",
  "reservations": string | null,
  "revision_suggestion": string | null
}

Apply the hard gates (§8.1) first; a single gate failure means the work fails regardless of score. Score honestly against §8.2. Do NOT compute a total or verdict — only provide gates, scores, and notes.

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
