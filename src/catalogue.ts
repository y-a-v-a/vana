import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { loadConfig } from "./config.ts";

/**
 * The catalogue is the living index of every work the system knows about:
 * - `historical` — Vincent's existing corpus (seeded from DNA.md §7), used by the
 *   jury's G6 (not-a-duplicate) gate and by the generator to avoid re-treading.
 * - `pending` | `published` | `rejected` — works produced by this harness.
 *
 * Both the generator and the jury read it. The seed is the DNA §7 table verbatim.
 */
export type CatalogueStatus = "historical" | "pending" | "published" | "rejected";

export interface CatalogueEntry {
  id: string;
  title: string;
  year: number | string;
  source: string; // referenced idea / artist (DNA §5)
  mechanism: string; // why it's in the DNA (the web/AI mechanism)
  status: CatalogueStatus;
}

// DNA.md §7 — reference corpus. Kept verbatim so the dedup gate (G6) has the
// real history to compare against. `id` is a stable slug of the title.
const HISTORICAL: Omit<CatalogueEntry, "status">[] = [
  { id: "the-agreeing-internet", title: "The Agreeing Internet", year: 2009, source: "the internet's conformity", mechanism: "site that always agrees" },
  { id: "the-internet-underexposed", title: "The Internet Underexposed", year: 2009, source: "net critique", mechanism: "—" },
  { id: "for-the-love-of-fame", title: "For the Love of Fame", year: 2009, source: "Hirst / fame & money (P6)", mechanism: "—" },
  { id: "maleglitch", title: "Maleglitch", year: 2010, source: "Malevich / Suprematism (P5 chance)", mechanism: "JPEG databending; live infinite Hypersuprematist compositions served via RSS + JSON API; format artifacts become the image" },
  { id: "l-h-o-o-q", title: "l-h-o-o-q.org", year: 2010, source: "Duchamp, L.H.O.O.Q. (P2)", mechanism: "Mona Lisa + perpetual loading state" },
  { id: "googlevich", title: "Googlevich", year: 2011, source: "Malevich + Google", mechanism: "—" },
  { id: "god-is-a-tj", title: "God is a TJ", year: 2011, source: "religion / absurdity", mechanism: "—" },
  { id: "la-trahison-des-images", title: "la-trahison-des-images.be", year: 2012, source: "Magritte (P1)", mechanism: "responsive layout stretches the pipe; the medium enacts 'this is not a pipe'" },
  { id: "i-m-too-sad-to-tell-you", title: "i-m-too-sad-to-tell-you", year: 2012, source: "Bas Jan Ader", mechanism: "—" },
  { id: "wewillmiss", title: "@wewillmiss", year: 2012, source: "bot / memory (P4)", mechanism: "'I miss #Beusy, I miss #Warhol...'" },
  { id: "modernipsum", title: "Modernipsum", year: 2012, source: "art-ism discourse (P9)", mechanism: "lorem-ipsum generator built from art 'isms'" },
  { id: "neuropolis-n", title: "Neuropolis N", year: 2012, source: "—", mechanism: "—" },
  { id: "art-is-money", title: "Art is Money", year: 2013, source: "Brener + Malevich (P6)", mechanism: "homage to the dollar-sign defacement" },
  { id: "hashtag-god", title: "@_hashtag_god", year: 2017, source: "the Bible / platform logic (P4)", mechanism: "bot tweeting the whole Bible, every word a #hashtag" },
  { id: "tableau-piege-en-ligne", title: "Tableau Piège En Ligne (bij-ons-aan-tafel.nl)", year: 2018, source: "Daniel Spoerri", mechanism: "'Spoerri meets/eats Google'" },
  { id: "three-ball-total-equilibrium-slot-machine", title: "Three Ball Total Equilibrium Slot Machine", year: 2020, source: "Jeff Koons (P6)", mechanism: "basketballs-in-tank as playable slot machine; staged with wall label, medium 'pixels on screen', price '$22,170,000', red sold dot" },
  { id: "pop-whaam", title: "Pop Whaam!", year: 2020, source: "Lichtenstein", mechanism: "—" },
  { id: "a-chance-of-order", title: "A Chance of Order", year: 2021, source: "Kenneth Martin (P5 order)", mechanism: "rule-based line-bundle compositions in HTML/CSS/JS" },
  { id: "the-webpage-going-on-and-off", title: "The webpage going on and off", year: 2023, source: "Martin Creed, Work No. 227 (P1)", mechanism: "page cycles white 7s / black 10s forever via the render loop" },
  { id: "but-is-it-art", title: "But is it art?", year: 2025, source: "the eternal question (P3)", mechanism: "a page that displays one word: YES" },
  { id: "tragedian", title: "Tragedian", year: 2025, source: "Cattelan, Comedian (P2)", mechanism: "morphing photoreal fruit + duct tape that vanishes on touch" },
  { id: "images-that-never-were", title: "Images That Never Were", year: 2025, source: "art-vandalism history + AI (P10)", mechanism: "cinematic AI tableaux of undocumented art attacks" },
  { id: "andy-warhol-eating-a-hamburger-svg", title: "Andy Warhol eating a hamburger (SVG)", year: 2026, source: "Warhol + Willison SVG-benchmark (P10)", mechanism: "LLM-generated SVGs compared across models, on Warhol color-bands" },
];

export function seedCatalogue(): CatalogueEntry[] {
  const cfg = loadConfig();
  if (existsSync(cfg.abs.catalogue)) {
    return loadCatalogue();
  }
  const entries: CatalogueEntry[] = HISTORICAL.map((e) => ({ ...e, status: "historical" }));
  writeCatalogue(entries);
  return entries;
}

export function loadCatalogue(): CatalogueEntry[] {
  const cfg = loadConfig();
  if (!existsSync(cfg.abs.catalogue)) return [];
  return JSON.parse(readFileSync(cfg.abs.catalogue, "utf8")) as CatalogueEntry[];
}

export function writeCatalogue(entries: CatalogueEntry[]): void {
  const cfg = loadConfig();
  writeFileSync(cfg.abs.catalogue, JSON.stringify(entries, null, 2) + "\n", "utf8");
}

/** Append or update an entry by id, then persist. */
export function upsertEntry(entry: CatalogueEntry): CatalogueEntry[] {
  const entries = loadCatalogue();
  const idx = entries.findIndex((e) => e.id === entry.id);
  if (idx >= 0) entries[idx] = entry;
  else entries.push(entry);
  writeCatalogue(entries);
  return entries;
}

/** Compact view for prompting the generator/jury: "Title (year) — source — mechanism". */
export function catalogueDigest(entries = loadCatalogue()): string {
  return entries
    .map((e) => `- ${e.title} (${e.year}) — ${e.source} — ${e.mechanism}`)
    .join("\n");
}

// CLI: `npm run seed`
if (import.meta.url === `file://${process.argv[1]}`) {
  const cmd = process.argv[2];
  if (cmd === "seed") {
    const entries = seedCatalogue();
    console.log(`Seeded catalogue with ${entries.length} entries.`);
  } else {
    console.error(`Unknown command: ${cmd ?? "(none)"}. Try: seed`);
    process.exit(1);
  }
}
