import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { loadConfig } from "./config.ts";
import type { GeneratedMeta } from "./generator.ts";
import { escapeHtml } from "./dashboard.ts";
import { HEIGHT, THUMB_WIDTHS, WIDTH, thumbFile } from "./screenshot.ts";

export interface PublishedWork {
  id: string;
  meta: GeneratedMeta;
  /** Content hash of the thumbnails (cache-busting `?v=`); absent until captured. */
  thumbVersion?: string;
}

const THUMB_FILES = THUMB_WIDTHS.map(thumbFile);
// Per-work files copied into the public site. jury.json (the private jury
// verdict) is deliberately omitted so it never ships to visitors, and so is
// the full-size screenshot.png: the catalogue only needs the thumbnails.
const PUBLIC_FILES = ["index.html", "motivation.md", "meta.json", ...THUMB_FILES];

// Thumbnails in the first screenful load right away; the rest wait for scroll.
const EAGER_THUMBS = 3;
// Must match the .thumb column in the catalogue CSS below.
const THUMB_SIZES = "(min-width: 36rem) 15rem, calc(100vw - 3rem)";

/** A short hash over all of a work's thumbnails, or undefined if any is missing. */
function thumbVersion(workDir: string): string | undefined {
  const hash = createHash("sha256");
  for (const f of THUMB_FILES) {
    const p = join(workDir, f);
    if (!existsSync(p)) return undefined;
    hash.update(readFileSync(p));
  }
  return hash.digest("hex").slice(0, 10);
}

/** Read published works (newest first), skipping any malformed dirs. */
export function listPublished(publishedRoot: string): PublishedWork[] {
  if (!existsSync(publishedRoot)) return [];
  const works: PublishedWork[] = [];
  for (const e of readdirSync(publishedRoot, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    try {
      const meta = JSON.parse(
        readFileSync(join(publishedRoot, e.name, "meta.json"), "utf8"),
      ) as GeneratedMeta;
      works.push({ id: e.name, meta, thumbVersion: thumbVersion(join(publishedRoot, e.name)) });
    } catch {
      // skip
    }
  }
  return works.sort((a, b) => b.id.localeCompare(a.id));
}

/**
 * The work's screenshot, linking to it. It repeats the title link, so it is
 * hidden from assistive tech and the tab order.
 */
function renderThumb(w: PublishedWork, index: number): string {
  if (!w.thumbVersion) return "";
  const href = `/${encodeURIComponent(w.id)}/`;
  const url = (width: number) => `${href}${thumbFile(width)}?v=${w.thumbVersion}`;
  const srcset = THUMB_WIDTHS.map((width) => `${url(width)} ${width}w`).join(", ");
  const [w0] = THUMB_WIDTHS;
  const lazy = index < EAGER_THUMBS ? "" : ` loading="lazy"`;
  return `<a class="thumb" href="${href}" tabindex="-1" aria-hidden="true"><img src="${url(w0)}" srcset="${srcset}" sizes="${THUMB_SIZES}" width="${w0}" height="${(w0 * HEIGHT) / WIDTH}" alt="" decoding="async"${lazy}></a>`;
}

/** The living catalogue page — itself a work (DNA §9.5). Self-contained, CC. */
export function renderCatalogueIndex(works: PublishedWork[]): string {
  const items =
    works.length === 0
      ? `<p class="muted">The catalogue is empty — for now.</p>`
      : works
          .map((w, i) => {
            const year = w.id.slice(0, 4);
            const thumb = renderThumb(w, i);
            return `<li${thumb ? ` class="has-thumb"` : ""}>
    ${thumb}
    <div>
      <a href="/${encodeURIComponent(w.id)}/">${escapeHtml(w.meta.title)}</a>
      <span class="year">${escapeHtml(year)}</span>
      <span class="ref">${escapeHtml(w.meta.references.join("; "))}</span>
      <div class="summary">${escapeHtml(w.meta.summary)}</div>
    </div>
  </li>`;
          })
          .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>y-a-v-a · machine works</title>
<style>
  :root{--ink:#1a1a1a;--muted:#6b6b6b;--accent:#002fa7;--paper:#f4f1e9;--line:#e3e0d8}
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.55 Georgia,serif}
  main{max-width:46rem;margin:0 auto;padding:3rem 1.5rem 5rem}
  h1{font-weight:400;font-size:1.6rem;margin:0 0 .2rem}
  .byline{color:var(--muted);font-size:.9rem;margin:0 0 .8rem}
  .lede{color:var(--muted);margin:0 0 2.5rem}
  a{color:var(--accent)}
  ul{list-style:none;margin:0;padding:0}
  li{padding:1.1rem 0;border-top:1px solid var(--line)}
  li a{color:var(--accent);text-decoration:none;font-size:1.15rem}
  .year{color:var(--muted);font:13px/1 monospace;margin-left:.5rem}
  .ref{display:block;color:var(--muted);font-size:.85rem;margin-top:.15rem}
  .summary{margin-top:.35rem}
  .thumb{display:block;margin-bottom:.8rem}
  .thumb img{display:block;width:100%;height:auto;background:var(--line);border-radius:4px;box-shadow:0 0 0 1px var(--line)}
  .thumb:hover img{box-shadow:0 0 0 1px var(--accent)}
  @media (min-width:36rem){
    li.has-thumb{display:grid;grid-template-columns:15rem 1fr;gap:1.25rem;align-items:start}
    .thumb{margin:0}
  }
  footer{margin-top:3rem;color:var(--muted);font-size:.8rem;border-top:1px solid var(--line);padding-top:1rem}
</style>
</head>
<body>
<main>
  <header>
    <h1>y-a-v-a · machine works</h1>
    <p class="byline">&copy; 2026 Vincent Bruijn &middot; <a href="https://www.y-a-v-a.org">y-a-v-a.org</a></p>
    <p class="lede">Works drawn from the y-a-v-a DNA by an autonomous agent, judged by an independent AI jury, and confirmed by Vincent Bruijn before publication.</p>
  </header>
  <ul>
${items}
  </ul>
  <footer>
    AI-generated, DNA-validated, validated by Vincent Bruijn. y-a-v-a (and ax710 where relevant).
    Creative Commons. No cookies, no tracking.
    <p>&copy; 2026 Vincent Bruijn &middot; <a href="https://www.y-a-v-a.org">y-a-v-a.org</a></p>
  </footer>
</main>
</body>
</html>
`;
}

/**
 * Assemble the public site into `outDir`: each published work's PUBLIC_FILES
 * (never jury.json) plus the catalogue index. The output dir is rebuilt fresh.
 */
export function buildSite(publishedRoot: string, outDir: string): { count: number } {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const works = listPublished(publishedRoot);
  for (const w of works) {
    const dest = join(outDir, w.id);
    mkdirSync(dest, { recursive: true });
    for (const f of PUBLIC_FILES) {
      const src = join(publishedRoot, w.id, f);
      if (existsSync(src)) copyFileSync(src, join(dest, f));
    }
  }
  writeFileSync(join(outDir, "index.html"), renderCatalogueIndex(works), "utf8");
  return { count: works.length };
}

// CLI: `npm run build:site`
if (import.meta.url === `file://${process.argv[1]}`) {
  const cfg = loadConfig();
  const outDir = join(cfg.abs.root, "dist-site");
  const { count } = buildSite(cfg.abs.published, outDir);
  console.log(`Built site: ${count} work(s) → ${outDir} (jury.json excluded)`);
}
