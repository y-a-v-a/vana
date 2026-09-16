import { readdirSync } from "node:fs";
import { join } from "node:path";
import { readGeneratedFiles } from "./generator.ts";
import { juryCandidate } from "./jury.ts";
import { readAllVerdicts, histogram, modeShare } from "./jury-stats.ts";

// `npm run jury:sample -- [n]` — re-jury n already-decided works with the
// CURRENT prompt and print old → new totals side by side. Writes nothing; costs
// about $0.005 per work. Use it to check whether a change to the §8.2 anchors
// actually spreads the scores, before waiting weeks of scheduled wakes.

const n = Number(process.argv[2] ?? 12);
const dirs: string[] = [];
for (const state of ["published", "pending", "rejected"]) {
  const root = join("workspace", state);
  for (const id of readdirSync(root)) if (!id.startsWith(".")) dirs.push(join(root, id));
}
// deterministic spread across the catalogue: every k-th work
const step = Math.max(1, Math.floor(dirs.length / n));
const sample = dirs.filter((_, i) => i % step === 0).slice(0, n);

const oldById = new Map(readAllVerdicts().map((v) => [v.work_id, v]));
const before: number[] = [];
const after: number[] = [];
for (const dir of sample) {
  const id = dir.split("/").pop()!;
  const old = oldById.get(id);
  let verdict;
  try {
    ({ verdict } = await juryCandidate(id, readGeneratedFiles(dir)));
  } catch (err) {
    console.log(`${id.padEnd(62)} ${String(old?.weighted_total ?? "?").padStart(2)} → FAILED  ${(err as Error).message.slice(0, 120)}`);
    continue;
  }
  const s = verdict.scores;
  before.push(old?.weighted_total ?? -1);
  after.push(verdict.weighted_total);
  console.log(
    `${id.padEnd(62)} ${String(old?.weighted_total ?? "?").padStart(2)} → ${String(verdict.weighted_total).padStart(2)}` +
      `  [${s.novelty}/${s.nuance}/${s.narrative}/${s.craft}/${s.wit}] ${verdict.verdict}`,
  );
  if (verdict.score_notes) for (const [k, note] of Object.entries(verdict.score_notes)) console.log(`    ${k.padEnd(9)} ${note}`);
}
const b = modeShare(before);
const a = modeShare(after);
console.log(`\nbefore: mode ${b.mode} in ${(b.share * 100).toFixed(0)}%  ${[...histogram(before)].map(([k, v]) => `${k}×${v}`).join(" ")}`);
console.log(`after : mode ${a.mode} in ${(a.share * 100).toFixed(0)}%  ${[...histogram(after)].map(([k, v]) => `${k}×${v}`).join(" ")}`);
