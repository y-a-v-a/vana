import { existsSync, renameSync } from "node:fs";
import { join } from "node:path";
import { loadConfig } from "./config.ts";
import { loadCatalogue, writeCatalogue, type CatalogueStatus } from "./catalogue.ts";
import { isValidId } from "./ids.ts";
import { commitAndPush } from "./git.ts";

export type Decision = "approve" | "reject";

export interface DecisionResult {
  id: string;
  status: Extract<CatalogueStatus, "published" | "rejected">;
  dir: string;
}

/** Map a human decision to its terminal status + commit verb (pure, testable). */
export function statusFor(decision: Decision): {
  status: Extract<CatalogueStatus, "published" | "rejected">;
  verb: string;
} {
  return decision === "approve"
    ? { status: "published", verb: "publish" }
    : { status: "rejected", verb: "reject" };
}

function setCatalogueStatus(id: string, status: CatalogueStatus): void {
  const entries = loadCatalogue();
  const entry = entries.find((e) => e.id === id);
  if (entry) {
    entry.status = status;
    writeCatalogue(entries);
  }
}

/**
 * Apply the human gate: move a pending candidate to published/ (approve) or
 * rejected/ (reject), update the catalogue, and commit + push. Approving is the
 * ONLY path that writes to published/ — the directory the public site serves.
 */
export async function decide(
  id: string,
  decision: Decision,
  opts: { push?: boolean } = {},
): Promise<DecisionResult> {
  if (!isValidId(id)) throw new Error(`Invalid candidate id: ${id}`);
  const cfg = loadConfig();
  const src = join(cfg.abs.pending, id);
  if (!existsSync(src)) throw new Error(`No pending candidate: ${id}`);

  const { status, verb } = statusFor(decision);
  const destRoot = decision === "approve" ? cfg.abs.published : cfg.abs.rejected;
  const dest = join(destRoot, id);
  if (existsSync(dest)) throw new Error(`Destination already exists: ${dest}`);

  renameSync(src, dest);
  setCatalogueStatus(id, status);

  await commitAndPush(`${verb}: ${id}`, {
    cwd: cfg.abs.root,
    remote: cfg.git.remote,
    branch: cfg.git.branch,
    push: opts.push ?? cfg.git.push,
  });

  return { id, status, dir: dest };
}
