import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

// Repo root = parent of src/. All config paths resolve relative to it.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

loadDotenv({ path: resolve(ROOT, ".env") });

const ConfigSchema = z.object({
  interval: z.object({ hours: z.number().positive() }),
  workBudget: z.object({ minutes: z.number().positive() }),
  costFuse: z.object({
    perWakeUsd: z.number().positive(),
    perDayUsd: z.number().positive(),
  }),
  models: z.object({
    generator: z.string().min(1),
    jury: z.string().min(1),
  }),
  thresholds: z.object({
    strong: z.number(),
    borderline: z.number(),
  }),
  paths: z.object({
    dna: z.string(),
    catalogue: z.string(),
    pending: z.string(),
    published: z.string(),
    rejected: z.string(),
  }),
  dashboard: z.object({
    port: z.number().int().positive(),
    tailnetHost: z.string(),
  }),
  email: z.object({ to: z.string().email() }),
  git: z.object({ remote: z.string(), branch: z.string(), push: z.boolean().default(true) }),
});

export type Config = z.infer<typeof ConfigSchema> & {
  /** Absolute filesystem paths, resolved from `paths` against the repo root. */
  abs: {
    root: string;
    dna: string;
    catalogue: string;
    pending: string;
    published: string;
    rejected: string;
  };
};

export type Secrets = {
  anthropicApiKey: string;
  openRouterApiKey: string;
};

export type Smtp = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

let cached: Config | null = null;

export function loadConfig(): Config {
  if (cached) return cached;
  const raw = JSON.parse(readFileSync(resolve(ROOT, "vana.config.json"), "utf8"));
  const parsed = ConfigSchema.parse(raw);
  cached = {
    ...parsed,
    abs: {
      root: ROOT,
      dna: resolve(ROOT, parsed.paths.dna),
      catalogue: resolve(ROOT, parsed.paths.catalogue),
      pending: resolve(ROOT, parsed.paths.pending),
      published: resolve(ROOT, parsed.paths.published),
      rejected: resolve(ROOT, parsed.paths.rejected),
    },
  };
  return cached;
}

/**
 * Read required secrets from the environment. Throws a clear, actionable error
 * if either key is missing — the harness is useless without both.
 */
export function loadSecrets(): Secrets {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const openRouterApiKey = process.env.OPENROUTER_API_KEY?.trim();
  const missing: string[] = [];
  if (!anthropicApiKey) missing.push("ANTHROPIC_API_KEY (generator)");
  if (!openRouterApiKey) missing.push("OPENROUTER_API_KEY (jury)");
  if (missing.length > 0) {
    throw new Error(
      `Missing required secret(s): ${missing.join(", ")}. ` +
        `Set them in .env (see .env.example).`,
    );
  }
  return { anthropicApiKey: anthropicApiKey!, openRouterApiKey: openRouterApiKey! };
}

/**
 * SMTP settings for the agent mailbox (e.g. agent@vincentbruijn.nl), read from
 * the environment so credentials live in .zshenv/.env, not in the repo.
 */
export function loadSmtp(): Smtp {
  const host = process.env.ONI_MAIL_SERVER?.trim();
  const user = process.env.ONI_MAIL_ADDRESS?.trim();
  const pass = process.env.ONI_MAIL_PASSWORD;
  const missing: string[] = [];
  if (!host) missing.push("ONI_MAIL_SERVER");
  if (!user) missing.push("ONI_MAIL_ADDRESS");
  if (!pass) missing.push("ONI_MAIL_PASSWORD");
  if (missing.length > 0) {
    throw new Error(`Missing mail env: ${missing.join(", ")} (set in .zshenv or .env).`);
  }
  const port = process.env.ONI_MAIL_PORT ? Number(process.env.ONI_MAIL_PORT) : 465;
  return {
    host: host!,
    port,
    secure: port === 465,
    user: user!,
    pass: pass!,
    from: process.env.ONI_MAIL_FROM?.trim() || user!,
  };
}

export const ROOT_DIR = ROOT;
