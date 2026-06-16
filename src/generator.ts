import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { query, type Options, type SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { loadConfig } from "./config.ts";
import { loadDna } from "./dna.ts";
import { catalogueDigest } from "./catalogue.ts";

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
export function buildGeneratorTask(digest: string): string {
  return `Generate ONE new candidate artwork in the y-a-v-a DNA and write exactly three files into the current working directory:

1. **index.html** — the work itself. Hard requirement: FULLY SELF-CONTAINED. All CSS and JS inline. NO external requests of any kind — no external \`src=\`, no \`<link href="http...">\`, no \`@import\`, no \`url(http...)\`, no web fonts, no \`fetch\`/\`XMLHttpRequest\`/\`WebSocket\`/\`EventSource\`, no analytics, no cookies, no trackers. Visibly state the Creative Commons license and attribution (y-a-v-a, plus the referenced artist/work).

2. **motivation.md** — 2 to 5 short paragraphs: the concept; which DNA principles it enacts (by ID, e.g. P1, P5); at least one named art-historical or web-native reference it answers; and how the *mechanism itself* is the argument (not decoration).

3. **meta.json** — strict JSON, no comments:
   {"title": string, "summary": string (one line), "mechanism": string (one line: the web/AI mechanism), "principles": string[] (DNA principle IDs), "references": string[] (named works/artists), "license": string}

Constraints:
- Must clear the hard gates G1–G6 (DNA §8.1): web/AI-native (could not be a static print), a real conceptual point, mechanism enacts the idea, license + attribution + no trackers, dry cheerful-cynic voice, and materially distinct from every catalogued work below (G6).
- Smallest build that completes the thought (P3). Self-contained, client-side only.
- Commit to one strong idea. Do not ask questions.

Do NOT duplicate any of these existing works:
${digest}

Write index.html, motivation.md, and meta.json now.`;
}

// ── Self-containment validation (pure, testable) ─────────────────────────────
// Patterns that trigger a network request on load. Note: <a href="http..."> is
// allowed (user-initiated, e.g. the license link) and intentionally NOT flagged.
const EXTERNAL_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "external src", re: /\bsrc\s*=\s*["']?\s*(?:https?:)?\/\//i },
  { name: "external <link href>", re: /<link\b[^>]*\bhref\s*=\s*["']?\s*(?:https?:)?\/\//i },
  { name: "css url() external", re: /url\(\s*["']?\s*(?:https?:)?\/\//i },
  { name: "@import external", re: /@import\s+(?:url\()?["']?\s*(?:https?:)?\/\//i },
  { name: "fetch()", re: /\bfetch\s*\(/i },
  { name: "XMLHttpRequest", re: /\bXMLHttpRequest\b/i },
  { name: "WebSocket", re: /\bnew\s+WebSocket\b/i },
  { name: "EventSource", re: /\bnew\s+EventSource\b/i },
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

// ── The agentic generation step (integration; exercised by `npm run once`) ────
/**
 * Run the generator agent (Claude Opus via the Agent SDK) to produce a candidate
 * in `workDir`. Returns the read-back files plus any self-containment violations.
 */
export async function generateCandidate(workDir: string): Promise<GenerationResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required for the generator (see .env.example).");
  }
  const cfg = loadConfig();
  mkdirSync(workDir, { recursive: true });

  const options: Options = {
    model: cfg.models.generator,
    cwd: workDir,
    systemPrompt: {
      type: "preset",
      preset: "claude_code",
      append: buildGeneratorSystemAppend(loadDna()),
    },
    allowedTools: ["Read", "Write"],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
  };

  const task = buildGeneratorTask(catalogueDigest());

  let finalResult: SDKResultMessage | null = null;
  for await (const message of query({ prompt: task, options })) {
    if (message.type === "result") finalResult = message;
  }
  if (!finalResult) throw new Error("Generator produced no result message");
  if (finalResult.is_error) {
    const errs = "errors" in finalResult ? finalResult.errors.join("; ") : "";
    throw new Error(`Generator failed (${finalResult.subtype}): ${errs}`);
  }

  let files: GeneratedFiles;
  try {
    files = readGeneratedFiles(workDir);
  } catch (err) {
    throw new Error(
      `${(err as Error).message}\nAgent subtype: ${finalResult.subtype}, cost: $${finalResult.total_cost_usd}`,
    );
  }

  return {
    files,
    violations: validateSelfContained(files.html),
    costUsd: finalResult.total_cost_usd,
  };
}
