import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { loadConfig } from "./config.ts";

// Saved next to each published work's index.html.
export const SCREENSHOT_FILE = "screenshot.png";
export const WIDTH = 1280;
export const HEIGHT = 800;

const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/** Published work dirs that have an index.html but no screenshot yet. */
export function worksNeedingScreenshot(publishedRoot: string): string[] {
  if (!existsSync(publishedRoot)) return [];
  return readdirSync(publishedRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter(
      (id) =>
        existsSync(join(publishedRoot, id, "index.html")) &&
        !existsSync(join(publishedRoot, id, SCREENSHOT_FILE)),
    )
    .sort();
}

/** Chrome CLI args for a headless 1280-wide screenshot of `url` into `out`. */
export function chromeArgs(url: string, out: string): string[] {
  return [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--window-size=${WIDTH},${HEIGHT}`,
    // Let animations/timers settle a little before capture.
    "--virtual-time-budget=3000",
    `--screenshot=${out}`,
    url,
  ];
}

export function screenshotWork(chrome: string, workDir: string): void {
  const url = pathToFileURL(join(workDir, "index.html")).href;
  execFileSync(chrome, chromeArgs(url, join(workDir, SCREENSHOT_FILE)), {
    stdio: "ignore",
    timeout: 60_000,
  });
}

// CLI: `npm run screenshots`
if (import.meta.url === `file://${process.argv[1]}`) {
  const chrome = process.env.CHROME_PATH ?? DEFAULT_CHROME;
  if (!existsSync(chrome)) {
    console.error(`Chrome not found at ${chrome} — set CHROME_PATH.`);
    process.exit(1);
  }
  const root = loadConfig().abs.published;
  const ids = worksNeedingScreenshot(root);
  console.log(`${ids.length} work(s) need a screenshot.`);
  let failed = 0;
  for (const id of ids) {
    try {
      screenshotWork(chrome, join(root, id));
      console.log(`  ✓ ${id}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${id}: ${(err as Error).message}`);
    }
  }
  if (failed) process.exit(1);
}
