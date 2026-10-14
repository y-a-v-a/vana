import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderCatalogueIndex, buildSite, type PublishedWork } from "./site.ts";

const work: PublishedWork = {
  id: "2026-06-16-the-original",
  meta: {
    title: "The <Original>",
    summary: "A & B",
    mechanism: "blob",
    principles: ["P1"],
    references: ["Benjamin"],
    license: "CC BY-SA 4.0",
  },
};

test("renderCatalogueIndex lists works with escaped titles and links", () => {
  const html = renderCatalogueIndex([work]);
  assert.match(html, /href="\/2026-06-16-the-original\/"/);
  assert.match(html, /The &lt;Original&gt;/);
  assert.match(html, /Creative Commons/);
});

test("renderCatalogueIndex credits Vincent Bruijn in header and footer, linking y-a-v-a.org", () => {
  const html = renderCatalogueIndex([]);
  const credit = /&copy; 2026 Vincent Bruijn &middot; <a href="https:\/\/www\.y-a-v-a\.org">y-a-v-a\.org<\/a>/;
  assert.match(html.slice(html.indexOf("<header>"), html.indexOf("</header>")), credit);
  assert.match(html.slice(html.indexOf("<footer>"), html.indexOf("</footer>")), credit);
});

test("renderCatalogueIndex shows a cache-busted, responsive thumbnail linking to the work", () => {
  const html = renderCatalogueIndex([{ ...work, thumbVersion: "abc123" }]);
  assert.match(html, /<li class="has-thumb">/);
  assert.match(html, /<a class="thumb" href="\/2026-06-16-the-original\/" tabindex="-1" aria-hidden="true">/);
  assert.match(html, /src="\/2026-06-16-the-original\/screenshot-480\.webp\?v=abc123"/);
  assert.match(
    html,
    /srcset="\/2026-06-16-the-original\/screenshot-480\.webp\?v=abc123 480w, \/2026-06-16-the-original\/screenshot-960\.webp\?v=abc123 960w"/,
  );
  assert.match(html, /width="480" height="300" alt=""/);
});

test("renderCatalogueIndex loads the first thumbnails eagerly and lazy-loads the rest", () => {
  const works = Array.from({ length: 5 }, (_, i) => ({ ...work, id: `2026-06-1${i}-w`, thumbVersion: "v" }));
  const imgs = renderCatalogueIndex(works).match(/<img [^>]*>/g) ?? [];
  assert.equal(imgs.length, 5);
  assert.deepEqual(
    imgs.map((t) => t.includes(`loading="lazy"`)),
    [false, false, false, true, true],
  );
});

test("renderCatalogueIndex omits the thumbnail for a work without one", () => {
  const html = renderCatalogueIndex([work]);
  assert.doesNotMatch(html, /<img /);
  assert.doesNotMatch(html, /class="has-thumb"/);
});

test("renderCatalogueIndex handles an empty catalogue", () => {
  assert.match(renderCatalogueIndex([]), /catalogue is empty/);
});

test("buildSite copies index.html + motivation.md + meta.json + thumbnails but NEVER jury.json", () => {
  const root = mkdtempSync(join(tmpdir(), "vana-site-"));
  try {
    const pub = join(root, "published");
    const out = join(root, "out");
    const wdir = join(pub, "2026-06-16-the-original");
    mkdirSync(wdir, { recursive: true });
    writeFileSync(join(wdir, "index.html"), "<h1>work</h1>");
    writeFileSync(join(wdir, "motivation.md"), "why");
    writeFileSync(join(wdir, "meta.json"), JSON.stringify(work.meta));
    writeFileSync(join(wdir, "jury.json"), JSON.stringify({ secret: "verdict" }));
    writeFileSync(join(wdir, "screenshot.png"), "png");
    writeFileSync(join(wdir, "screenshot-480.webp"), "small");
    writeFileSync(join(wdir, "screenshot-960.webp"), "large");

    const { count } = buildSite(pub, out);
    assert.equal(count, 1);

    const od = join(out, "2026-06-16-the-original");
    assert.ok(existsSync(join(od, "index.html")), "work index.html present");
    assert.ok(existsSync(join(od, "motivation.md")), "motivation.md present");
    assert.ok(existsSync(join(od, "meta.json")), "meta.json present");
    assert.ok(!existsSync(join(od, "jury.json")), "jury.json MUST NOT be published");
    assert.ok(existsSync(join(od, "screenshot-480.webp")), "480w thumbnail present");
    assert.ok(existsSync(join(od, "screenshot-960.webp")), "960w thumbnail present");
    assert.ok(!existsSync(join(od, "screenshot.png")), "full-size PNG stays out of the site");
    assert.ok(existsSync(join(out, "index.html")), "catalogue index present");
    assert.match(readFileSync(join(out, "index.html"), "utf8"), /screenshot-480\.webp\?v=[0-9a-f]{10}"/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
