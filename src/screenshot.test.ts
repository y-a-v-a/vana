import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { displayUrl, renderBrowserFrame, worksNeedingScreenshot, SCREENSHOT_FILE } from "./screenshot.ts";

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "vana-shots-"));
  for (const id of ["b-new", "a-done", "c-empty"]) mkdirSync(join(root, id));
  writeFileSync(join(root, "b-new", "index.html"), "<p>");
  writeFileSync(join(root, "a-done", "index.html"), "<p>");
  writeFileSync(join(root, "a-done", SCREENSHOT_FILE), "png");
  writeFileSync(join(root, "stray.txt"), "x");
  return root;
}

test("worksNeedingScreenshot skips works that already have one", () => {
  assert.deepEqual(worksNeedingScreenshot(fixture()), ["b-new"]);
});

test("worksNeedingScreenshot with force includes every work with an index.html", () => {
  assert.deepEqual(worksNeedingScreenshot(fixture(), true), ["a-done", "b-new"]);
});

test("worksNeedingScreenshot tolerates a missing root", () => {
  assert.deepEqual(worksNeedingScreenshot("/nonexistent/vana"), []);
});

test("displayUrl is the public address without scheme", () => {
  assert.equal(displayUrl("2026-06-17-x"), "vana.y-a-v-a.org/2026-06-17-x/");
});

test("renderBrowserFrame shows the page's favicon and escaped title", () => {
  const html = renderBrowserFrame({
    title: "Red <&> Blue",
    iconUrl: "data:image/png;base64,AAA",
    url: "vana.y-a-v-a.org/w/",
    shot: "data:image/png;base64,BBB",
  });
  assert.match(html, /<img class="fav" src="data:image\/png;base64,AAA"/);
  assert.match(html, /Red &lt;&amp;&gt; Blue/);
  assert.match(html, /<span class="host">vana\.y-a-v-a\.org<\/span><span class="path">\/w\/<\/span>/);
  assert.match(html, /src="data:image\/png;base64,BBB"/);
});

test("renderBrowserFrame falls back to the default globe without a favicon", () => {
  const html = renderBrowserFrame({ title: "t", iconUrl: null, url: "h/", shot: "data:," });
  assert.doesNotMatch(html, /class="fav"/);
  assert.match(html, /<circle/);
});
