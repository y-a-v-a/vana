import { loadConfig, loadSmtp, type Config } from "./config.ts";
import { sendMail } from "./smtp.ts";
import type { GeneratedMeta } from "./generator.ts";
import type { JuryVerdict } from "./jury.ts";

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
  opts: { refined?: boolean } = {},
): Email {
  const s = verdict.scores;
  const tag = opts.refined ? "refined" : verdict.verdict;
  const subject = `vana · ${tag} ${verdict.weighted_total}/50 — ${meta.title}`;
  const body = [
    opts.refined
      ? "Your refinement is ready, re-juried, and still awaiting your confirmation."
      : "A new candidate passed the jury and is awaiting your confirmation.",
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

/** Send the candidate notification email over authenticated SMTP (integration). */
export async function sendCandidateEmail(
  id: string,
  meta: GeneratedMeta,
  verdict: JuryVerdict,
  opts: { refined?: boolean } = {},
): Promise<void> {
  const cfg = loadConfig();
  const smtp = loadSmtp();
  const { subject, body } = buildEmail(id, meta, verdict, dashboardUrl(cfg, id), opts);
  await sendMail(smtp, { from: smtp.from, to: cfg.email.to, subject, body });
}
