import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { loadConfig, type Config } from "./config.ts";
import type { GeneratedMeta } from "./generator.ts";
import type { JuryVerdict } from "./jury.ts";

const exec = promisify(execFile);

/** URL to the approval dashboard entry for a candidate (Phase 7 serves this). */
export function dashboardUrl(cfg: Config, id: string): string {
  const host = cfg.dashboard.tailnetHost || "localhost";
  return `http://${host}:${cfg.dashboard.port}/candidate/${id}`;
}

export interface Email {
  subject: string;
  body: string;
}

/** Build the notification email (pure, testable). */
export function buildEmail(
  id: string,
  meta: GeneratedMeta,
  verdict: JuryVerdict,
  url: string,
): Email {
  const s = verdict.scores;
  const subject = `vana · ${verdict.verdict} ${verdict.weighted_total}/50 — ${meta.title}`;
  const body = [
    "A new candidate passed the jury and is awaiting your confirmation.",
    "",
    `  ${meta.title}`,
    `  ${meta.summary}`,
    "",
    `Verdict: ${verdict.verdict} — ${verdict.weighted_total}/50`,
    `Scores: novelty ${s.novelty} · nuance ${s.nuance} · narrative ${s.narrative} · craft ${s.craft} · wit ${s.wit}`,
    `Principles: ${verdict.principles_invoked.join(", ")}`,
    `References: ${meta.references.join("; ")}`,
    "",
    "Jury rationale:",
    verdict.rationale,
    "",
    `Reservations: ${verdict.reservations ?? "none"}`,
    "",
    "Review & approve:",
    `  ${url}`,
    "",
    `Local: workspace/pending/${id}/index.html`,
    "",
    "— vana",
  ].join("\n");
  return { subject, body };
}

export interface SendResult {
  sent: boolean;
  warning?: string;
}

/**
 * Send the candidate notification email via Mail.app (integration).
 * A `-1712` AppleEvent timeout is treated as a soft warning, not a failure:
 * Mail has accepted the message into its Outbox and typically still delivers it.
 */
export async function sendCandidateEmail(
  id: string,
  meta: GeneratedMeta,
  verdict: JuryVerdict,
): Promise<SendResult> {
  const cfg = loadConfig();
  const { subject, body } = buildEmail(id, meta, verdict, dashboardUrl(cfg, id));
  const script = join(cfg.abs.root, "ops", "send-mail.applescript");
  try {
    await exec("osascript", [script, subject, body, cfg.email.to]);
    return { sent: true };
  } catch (err) {
    const stderr = `${(err as { stderr?: string }).stderr ?? (err as Error).message}`;
    if (/-1712|timed out/i.test(stderr)) {
      const warning = "Mail send timed out (-1712); message queued in Outbox — verify delivery.";
      console.warn(`[notify] ${warning}`);
      return { sent: false, warning };
    }
    throw err;
  }
}
