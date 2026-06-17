import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { query, type Options, type SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { loadConfig } from "./config.ts";
import { loadDna } from "./dna.ts";
import { catalogueDigest } from "./catalogue.ts";
import { loadGuidance, recentGuidance } from "./guidance.ts";

// ── Generated metadata (meta.json the generator must write) ──────────────────
const MetaSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  mechanism: z.string().min(1),
  principles: z.array(z.string()).min(1), // DNA principle IDs, e.g. ["P1","P5"]
  references: z.array(z.string()).min(1), // named works/artists answered
  license: z.string().min(1), // e.g. "CC BY-SA 4.0"
});
export type GeneratedMeta = z.infer<typeof MetaSchema>;

export interface GeneratedFiles {
  html: string;
  motivation: string;
  meta: GeneratedMeta;
}

export interface GenerationResult {
  files: GeneratedFiles;
  /** Self-containment violations; empty = clean. A non-empty list is a soft fail. */
  violations: string[];
  /** Provider-reported cost of this generation, USD (from the SDK result). */
  costUsd: number;
}

// ── Prompt construction (pure, testable) ─────────────────────────────────────

/** The generator's operating system: the DNA, framed as its identity. */
export function buildGeneratorSystemAppend(dna: string): string {
  return [
    "You are the GENERATOR agent described in section 0 of the artistic DNA below.",
    "Internalize this document as your operating system: it defines how a work earns",
    "the right to be called 'in the DNA'. Generate works that would pass its own jury.",
    "",
    "--- ARTISTIC DNA ---",
    dna,
  ].join("\n");
}

/** The concrete task: produce one self-contained candidate as three files. */
export function buildGeneratorTask(digest: string, guidance = ""): string {
  return `Generate ONE new candidate artwork in the y-a-v-a DNA and write exactly three files into the current working directory:

1. **index.html** — the work itself. Hard requirement: FULLY SELF-CONTAINED. All CSS and JS inline. NO external requests of any kind — no external \`src=\`, no \`<link href="http...">\`, no \`@import\`, no \`url(http...)\`, no web fonts, no \`fetch\`/\`XMLHttpRequest\`/\`WebSocket\`/\`EventSource\`, no analytics, no cookies, no trackers. Visibly state the Creative Commons license and attribution (y-a-v-a, plus the referenced artist/work).

2. **motivation.md** — 2 to 5 short paragraphs: the concept; which DNA principles it enacts (by ID, e.g. P1, P5); at least one named art-historical or web-native reference it answers; and how the *mechanism itself* is the argument (not decoration).

3. **meta.json** — strict JSON, no comments:
   {"title": string, "summary": string (one line), "mechanism": string (one line: the web/AI mechanism), "principles": string[] (DNA principle IDs), "references": string[] (named works/artists), "license": string}

Constraints:
- Must clear the hard gates G1–G6 (DNA §8.1): web/AI-native (could not be a static print), a real conceptual point, mechanism enacts the idea, license + attribution + no trackers, dry cheerful-cynic voice, and materially distinct from every catalogued work below (G6).
- Smallest build that completes the thought (P3). Self-contained, client-side only.
- Commit to one strong idea. Do not ask questions.
${guidance ? `\nThe artist has given accumulated guidance from past rejections. Treat it as binding direction and heed it:\n${guidance}\n` : ""}
Do NOT duplicate any of these existing works:
${digest}

Write index.html, motivation.md, and meta.json now.`;
}

/** Task for an in-place refinement driven by the artist's feedback. */
export function buildRefineTask(feedback: string): string {
  return `You previously generated the candidate artwork in the current working directory (index.html, motivation.md, meta.json). The artist reviewed it and asked for this refinement:

"""
${feedback}
"""

Revise the work to address the feedback. Read the current files first, then edit them in place. Requirements:
- This is a REFINEMENT, not a new work — preserve the concept and identity unless the feedback explicitly asks to change it.
- Keep index.html FULLY SELF-CONTAINED: all CSS/JS inline, NO external requests of any kind (no external src/href, @import, url(http), fetch, etc.).
- If the change affects them, update motivation.md and meta.json; keep meta.json valid (same fields).
- Still satisfy the DNA hard gates (G1–G6) and stay in the y-a-v-a voice.

Make the edits now. Do not create unrelated files and do not ask questions.`;
}

// ── Self-containment validation (pure, testable) ─────────────────────────────
// HEURISTIC FIRST PASS ONLY. This is a denylist and cannot be exhaustive; the
// real guarantee is the restrictive CSP + sandboxed iframe applied when a work
// is rendered (dashboard `/work` and the public site headers). A match here
// fails fast at generation time so we don't waste a jury call on an obvious
// violation. Note: <a href="http..."> is allowed (user-initiated license link).
const EXTERNAL_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "external src", re: /\bsrc\s*=\s*["']?\s*(?:https?:)?\/\//i },
  { name: "external srcset", re: /\b(?:image)?srcset\s*=\s*["'][^"']*(?:https?:)?\/\//i },
  { name: "external <link href>", re: /<link\b[^>]*\bhref\s*=\s*["']?\s*(?:https?:)?\/\//i },
  { name: "external <base href>", re: /<base\b[^>]*\bhref\s*=\s*["']?\s*(?:https?:)?\/\//i },
  { name: "css url() external", re: /url\(\s*["']?\s*(?:https?:)?\/\//i },
  { name: "@import external", re: /@import\s+(?:url\()?["']?\s*(?:https?:)?\/\//i },
  { name: "fetch()", re: /\bfetch\s*\(/i },
  { name: "dynamic import() url", re: /\bimport\s*\(\s*["'`]?\s*(?:https?:)?\/\//i },
  { name: "XMLHttpRequest", re: /\bXMLHttpRequest\b/i },
  { name: "sendBeacon", re: /\bsendBeacon\s*\(/i },
  { name: "WebSocket", re: /\bnew\s+WebSocket\b/i },
  { name: "EventSource", re: /\bnew\s+EventSource\b/i },
  { name: "external form action", re: /\baction\s*=\s*["']?\s*(?:https?:)?\/\//i },
  { name: "anchor ping", re: /\bping\s*=\s*["']?\s*(?:https?:)?\/\//i },
  { name: "meta refresh redirect", re: /http-equiv\s*=\s*["']?\s*refresh[^>]*\burl\s*=/i },
  { name: "external object/embed data", re: /\bdata\s*=\s*["']?\s*(?:https?:)?\/\//i },
  { name: "import map", re: /<script[^>]+type\s*=\s*["']?importmap/i },
];

/** Returns a list of self-containment violations (empty = clean). */
export function validateSelfContained(html: string): string[] {
  const violations: string[] = [];
  for (const { name, re } of EXTERNAL_PATTERNS) {
    const m = html.match(re);
    if (m) violations.push(`${name}: ${m[0].slice(0, 60)}`);
  }
  return violations;
}

// ── meta.json parsing (pure, testable) ───────────────────────────────────────
export function parseMeta(raw: string): GeneratedMeta {
  return MetaSchema.parse(JSON.parse(raw));
}

// ── File IO ──────────────────────────────────────────────────────────────────
/** Read and validate the three files the generator was asked to write. */
export function readGeneratedFiles(dir: string): GeneratedFiles {
  const need = (name: string): string => {
    const p = join(dir, name);
    if (!existsSync(p)) throw new Error(`Generator did not produce ${name} in ${dir}`);
    const content = readFileSync(p, "utf8").trim();
    if (!content) throw new Error(`Generator produced an empty ${name}`);
    return content;
  };
  const html = need("index.html");
  const motivation = need("motivation.md");
  const meta = parseMeta(need("meta.json"));
  return { html, motivation, meta };
}

// ── The agentic step (integration; exercised by `npm run once` / refine) ──────

/** Run the Opus agent in `workDir` with the given task + tools; return the result. */
async function runAgent(
  workDir: string,
  task: string,
  allowedTools: string[],
): Promise<SDKResultMessage> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required for the generator (see .env.example).");
  }
  const cfg = loadConfig();
  const options: Options = {
    model: cfg.models.generator,
    cwd: workDir,
    systemPrompt: {
      type: "preset",
      preset: "claude_code",
      append: buildGeneratorSystemAppend(loadDna()),
    },
    allowedTools,
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
  };
  let finalResult: SDKResultMessage | null = null;
  for await (const message of query({ prompt: task, options })) {
    if (message.type === "result") finalResult = message;
  }
  if (!finalResult) throw new Error("Agent produced no result message");
  if (finalResult.is_error) {
    const errs = "errors" in finalResult ? finalResult.errors.join("; ") : "";
    throw new Error(`Agent failed (${finalResult.subtype}): ${errs}`);
  }
  return finalResult;
}

function collect(dir: string, result: SDKResultMessage): GenerationResult {
  let files: GeneratedFiles;
  try {
    files = readGeneratedFiles(dir);
  } catch (err) {
    throw new Error(
      `${(err as Error).message}\nAgent subtype: ${result.subtype}, cost: $${result.total_cost_usd}`,
    );
  }
  return { files, violations: validateSelfContained(files.html), costUsd: result.total_cost_usd };
}

/** Produce a fresh candidate in `workDir`. */
export async function generateCandidate(workDir: string): Promise<GenerationResult> {
  mkdirSync(workDir, { recursive: true });
  const task = buildGeneratorTask(catalogueDigest(), recentGuidance(loadGuidance()));
  const result = await runAgent(workDir, task, ["Read", "Write"]);
  return collect(workDir, result);
}

/** Refine the existing candidate in `dir` in place, per the artist's feedback. */
export async function refineCandidate(dir: string, feedback: string): Promise<GenerationResult> {
  if (!existsSync(dir)) throw new Error(`No candidate dir to refine: ${dir}`);
  const result = await runAgent(dir, buildRefineTask(feedback), ["Read", "Write", "Edit"]);
  return collect(dir, result);
}
