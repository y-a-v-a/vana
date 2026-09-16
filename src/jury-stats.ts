import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { JuryVerdict } from "./jury.ts";

// `npm run jury:stats` — how spread out are the jury's scores? Used to check
// that the §8.2 anchors in jury.ts keep the distribution from collapsing onto
// a single total (the pre-anchor baseline was 54/144 works at exactly 40/50).

export function histogram(values: number[]): Map<number, number> {
  const h = new Map<number, number>();
  for (const v of values) h.set(v, (h.get(v) ?? 0) + 1);
  return new Map([...h].sort((a, b) => a[0] - b[0]));
}

/** Share of works whose weighted_total equals the single most common total. */
export function modeShare(values: number[]): { mode: number; share: number } {
  if (values.length === 0) return { mode: 0, share: 0 };
  let mode = values[0]!;
  let best = 0;
  for (const [v, n] of histogram(values)) if (n > best) ((best = n), (mode = v));
  return { mode, share: best / values.length };
}

export function readAllVerdicts(root = "workspace"): JuryVerdict[] {
  const out: JuryVerdict[] = [];
  for (const state of readdirSync(root)) {
    const dir = join(root, state);
    if (!statSync(dir).isDirectory()) continue;
    for (const id of readdirSync(dir)) {
      const f = join(dir, id, "jury.json");
      if (existsSync(f)) out.push(JSON.parse(readFileSync(f, "utf8")) as JuryVerdict);
    }
  }
  return out;
}

function bar(h: Map<number, number>, width = 3): string {
  return [...h].map(([k, n]) => `${String(k).padStart(width)} ${"#".repeat(n)} ${n}`).join("\n");
}

if (process.argv[1]?.endsWith("jury-stats.ts")) {
  const all = readAllVerdicts();
  const anchored = all.filter((v) => v.score_notes);
  for (const [label, set] of [
    ["all", all],
    ["with anchors", anchored],
  ] as const) {
    if (set.length === 0) continue;
    const totals = set.map((v) => v.weighted_total);
    const { mode, share } = modeShare(totals);
    console.log(`== ${label}: n=${set.length}, mode ${mode}/50 in ${(share * 100).toFixed(0)}% ==`);
    console.log(bar(histogram(totals)));
    for (const k of ["novelty", "nuance", "narrative", "craft", "wit"] as const) {
      const h = histogram(set.map((v) => v.scores[k]));
      console.log(k.padEnd(10), [...h].map(([s, n]) => `${s}:${n}`).join("  "));
    }
    console.log();
  }
}
