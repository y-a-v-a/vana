import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromeArgs, worksNeedingScreenshot, SCREENSHOT_FILE } from "./screenshot.ts";

test("worksNeedingScreenshot skips works that already have one", () => {
  const root = mkdtempSync(join(tmpdir(), "vana-shots-"));
  for (const id of ["b-new", "a-done", "c-empty"]) mkdirSync(join(root, id));
  writeFileSync(join(root, "b-new", "index.html"), "<p>");
  writeFileSync(join(root, "a-done", "index.html"), "<p>");
  writeFileSync(join(root, "a-done", SCREENSHOT_FILE), "png");
  writeFileSync(join(root, "stray.txt"), "x");
  assert.deepEqual(worksNeedingScreenshot(root), ["b-new"]);
});

test("worksNeedingScreenshot tolerates a missing root", () => {
  assert.deepEqual(worksNeedingScreenshot("/nonexistent/vana"), []);
});

test("chromeArgs captures a 1280-wide headless window", () => {
  const args = chromeArgs("file:///w/index.html", "/w/screenshot.png");
  assert.ok(args.includes("--headless=new"));
  assert.ok(args.some((a) => a.startsWith("--window-size=1280,")));
  assert.ok(args.includes("--screenshot=/w/screenshot.png"));
  assert.equal(args.at(-1), "file:///w/index.html");
});
