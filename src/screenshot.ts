import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { loadConfig } from "./config.ts";
import { escapeHtml } from "./dashboard.ts";

// Saved next to each published work's index.html.
export const SCREENSHOT_FILE = "screenshot.png";
// The whole window is 1280×800; the browser chrome (tab strip + toolbar) is
// drawn on top, the work renders in the viewport below it.
export const WIDTH = 1280;
export const HEIGHT = 800;
export const CHROME_HEIGHT = 80;
export const VIEWPORT_HEIGHT = HEIGHT - CHROME_HEIGHT;
// Let the work run (timers, animations, favicon painting) before capture.
const SETTLE_MS = 3000;
const LOAD_TIMEOUT_MS = 15_000;
const SITE_HOST = "vana.y-a-v-a.org";

const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/** Published work dirs with an index.html; unless `force`, only those lacking a screenshot. */
export function worksNeedingScreenshot(publishedRoot: string, force = false): string[] {
  if (!existsSync(publishedRoot)) return [];
  return readdirSync(publishedRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter(
      (id) =>
        existsSync(join(publishedRoot, id, "index.html")) &&
        (force || !existsSync(join(publishedRoot, id, SCREENSHOT_FILE))),
    )
    .sort();
}

/** The work's public address, as Chrome's omnibox shows it (no scheme). */
export function displayUrl(id: string): string {
  return `${SITE_HOST}/${id}/`;
}

export interface FrameParts {
  title: string;
  /** The page's favicon URL, or null for Chrome's default globe. */
  iconUrl: string | null;
  url: string;
  /** Data URL of the viewport capture. */
  shot: string;
}

const GLOBE = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#5f6368" stroke-width="1.2"><circle cx="8" cy="8" r="6.4"/><ellipse cx="8" cy="8" rx="2.8" ry="6.4"/><path d="M1.6 8h12.8M2.6 4.8h10.8M2.6 11.2h10.8"/></svg>`;

/** A Chrome-on-macOS style window (light theme) around the viewport capture. */
export function renderBrowserFrame(p: FrameParts): string {
  const icon = p.iconUrl
    ? `<img class="fav" src="${escapeHtml(p.iconUrl)}" alt="">`
    : GLOBE;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;background:#fff;
  font:12px -apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif;color:#202124}
.strip{height:40px;background:#dfe3e7;display:flex;align-items:flex-end;padding-left:78px;position:relative}
.lights{position:absolute;left:14px;top:14px;display:flex;gap:8px}
.lights i{width:12px;height:12px;border-radius:50%;display:block}
.tab{width:240px;height:32px;background:#fff;border-radius:8px 8px 0 0;display:flex;
  align-items:center;gap:8px;padding:0 10px 0 12px}
.fav{width:16px;height:16px;image-rendering:pixelated;flex:none}
.tab svg{flex:none}
.title{flex:1;white-space:nowrap;overflow:hidden;text-overflow:clip;
  -webkit-mask-image:linear-gradient(90deg,#000 85%,transparent)}
.x{color:#5f6368;font-size:14px;line-height:1}
.plus{color:#5f6368;font-size:18px;margin:0 0 7px 12px}
.bar{height:40px;background:#fff;display:flex;align-items:center;gap:6px;padding:0 10px;
  border-bottom:1px solid #dadce0}
.nav{width:28px;height:28px;display:flex;align-items:center;justify-content:center}
.omni{flex:1;height:30px;border-radius:15px;background:#eef1f4;display:flex;align-items:center;
  gap:10px;padding:0 14px;font-size:13.5px;margin-left:4px}
.omni .host{color:#202124}.omni .path{color:#5f6368}
.shot{display:block;width:${WIDTH}px;height:${VIEWPORT_HEIGHT}px}
</style></head><body>
<div class="strip">
  <div class="lights"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div>
  <div class="tab">${icon}<span class="title">${escapeHtml(p.title)}</span><span class="x">×</span></div>
  <span class="plus">+</span>
</div>
<div class="bar">
  <span class="nav"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#5f6368" stroke-width="1.6"><path d="M13 8H3M7.5 3.5 3 8l4.5 4.5"/></svg></span>
  <span class="nav"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#c4c7c5" stroke-width="1.6"><path d="M3 8h10M8.5 3.5 13 8l-4.5 4.5"/></svg></span>
  <span class="nav"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#5f6368" stroke-width="1.6"><path d="M13 8a5 5 0 1 1-1.5-3.6"/><path d="M12 1.8v3h-3"/></svg></span>
  <div class="omni"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#5f6368" stroke-width="1.5"><path d="M2 5h7M12 5h2M2 11h2M7 11h7"/><circle cx="10.5" cy="5" r="1.6"/><circle cx="5.5" cy="11" r="1.6"/></svg>${urlHtml(p.url)}</div>
</div>
<img class="shot" src="${p.shot}" alt="">
</body></html>`;
}

function urlHtml(url: string): string {
  const slash = url.indexOf("/");
  if (slash < 0) return `<span><span class="host">${escapeHtml(url)}</span></span>`;
  return `<span><span class="host">${escapeHtml(url.slice(0, slash))}</span><span class="path">${escapeHtml(url.slice(slash))}</span></span>`;
}

// --- Minimal Chrome DevTools Protocol client (flattened sessions, one socket).

type Msg = { id?: number; method?: string; params?: any; result?: any; error?: any; sessionId?: string };

class Cdp {
  private next = 1;
  private pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();
  private listeners = new Set<(m: Msg) => void>();
  private constructor(private ws: WebSocket) {
    ws.addEventListener("message", (ev) => {
      const m = JSON.parse(String(ev.data)) as Msg;
      if (m.id !== undefined) {
        const p = this.pending.get(m.id);
        this.pending.delete(m.id);
        if (m.error) p?.reject(new Error(m.error.message));
        else p?.resolve(m.result);
      } else for (const l of this.listeners) l(m);
    });
  }

  static connect(url: string): Promise<Cdp> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      ws.addEventListener("open", () => resolve(new Cdp(ws)));
      ws.addEventListener("error", () => reject(new Error(`CDP connect failed: ${url}`)));
    });
  }

  send(method: string, params: object = {}, sessionId?: string): Promise<any> {
    const id = this.next++;
    this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  /** Resolve on the next `method` event for `sessionId`, or after `timeoutMs`. */
  once(method: string, sessionId: string, timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
      const done = () => {
        clearTimeout(t);
        this.listeners.delete(l);
        resolve();
      };
      const l = (m: Msg) => m.method === method && m.sessionId === sessionId && done();
      const t = setTimeout(done, timeoutMs);
      this.listeners.add(l);
    });
  }

  on(l: (m: Msg) => void): void {
    this.listeners.add(l);
  }

  close(): void {
    this.ws.close();
  }
}

function launchChrome(chrome: string, profileDir: string): Promise<{ proc: ChildProcess; wsUrl: string }> {
  const proc = spawn(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=0",
    `--user-data-dir=${profileDir}`,
    "about:blank",
  ]);
  return new Promise((resolve, reject) => {
    let buf = "";
    proc.stderr!.on("data", (d) => {
      buf += String(d);
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) resolve({ proc, wsUrl: m[1]! });
    });
    proc.on("exit", (code) => reject(new Error(`Chrome exited (${code}) before DevTools was ready`)));
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function openPage(cdp: Cdp, url: string, width: number, height: number, settleMs: number): Promise<string> {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);
  const loaded = cdp.once("Page.loadEventFired", sessionId, LOAD_TIMEOUT_MS);
  await cdp.send("Page.navigate", { url }, sessionId);
  await loaded;
  await sleep(settleMs);
  return sessionId;
}

async function capture(cdp: Cdp, sessionId: string): Promise<string> {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
  return data as string;
}

async function closeSession(cdp: Cdp, sessionId: string): Promise<void> {
  const { targetInfo } = await cdp.send("Target.getTargetInfo", {}, sessionId);
  await cdp.send("Target.closeTarget", { targetId: targetInfo.targetId });
}

const PAGE_INFO = `(() => {
  const icons = [...document.querySelectorAll("link[rel~='icon']")];
  const icon = icons.length ? icons[icons.length - 1].href : null;
  return JSON.stringify({ title: document.title, icon });
})()`;

async function screenshotWork(cdp: Cdp, tmp: string, publishedRoot: string, id: string): Promise<void> {
  const workDir = join(publishedRoot, id);
  const s = await openPage(cdp, pathToFileURL(join(workDir, "index.html")).href, WIDTH, VIEWPORT_HEIGHT, SETTLE_MS);
  const { result } = await cdp.send("Runtime.evaluate", { expression: PAGE_INFO, returnByValue: true }, s);
  const info = JSON.parse(result.value) as { title: string; icon: string | null };
  const shot = await capture(cdp, s);
  await closeSession(cdp, s);

  const url = displayUrl(id);
  const framePath = join(tmp, `${id}.html`);
  writeFileSync(
    framePath,
    renderBrowserFrame({
      title: info.title.trim() || url,
      iconUrl: info.icon,
      url,
      shot: `data:image/png;base64,${shot}`,
    }),
  );
  const f = await openPage(cdp, pathToFileURL(framePath).href, WIDTH, HEIGHT, 100);
  writeFileSync(join(workDir, SCREENSHOT_FILE), Buffer.from(await capture(cdp, f), "base64"));
  await closeSession(cdp, f);
}

/**
 * Capture a framed screenshot for each of `ids` under `publishedRoot`, in one
 * headless Chrome. Per-work failures are collected, not thrown; a missing
 * Chrome or a failed launch throws.
 */
export async function captureScreenshots(
  publishedRoot: string,
  ids: string[],
  onDone: (id: string, err?: Error) => void = () => {},
): Promise<{ ok: string[]; failed: string[] }> {
  const result = { ok: [] as string[], failed: [] as string[] };
  if (ids.length === 0) return result;
  const chrome = process.env.CHROME_PATH ?? DEFAULT_CHROME;
  if (!existsSync(chrome)) throw new Error(`Chrome not found at ${chrome} — set CHROME_PATH.`);

  const tmp = mkdtempSync(join(tmpdir(), "vana-shots-"));
  const { proc, wsUrl } = await launchChrome(chrome, join(tmp, "profile"));
  try {
    const cdp = await Cdp.connect(wsUrl);
    // A stray alert()/confirm() would block the page forever; dismiss it.
    cdp.on((m) => {
      if (m.method === "Page.javascriptDialogOpening")
        void cdp.send("Page.handleJavaScriptDialog", { accept: true }, m.sessionId).catch(() => {});
    });
    for (const id of ids) {
      try {
        await screenshotWork(cdp, tmp, publishedRoot, id);
        result.ok.push(id);
        onDone(id);
      } catch (err) {
        result.failed.push(id);
        onDone(id, err as Error);
      }
    }
    cdp.close();
  } finally {
    const exited = new Promise((r) => proc.once("exit", r));
    proc.kill();
    await exited;
    rmSync(tmp, { recursive: true, force: true });
  }
  return result;
}

// CLI: `npm run screenshots [-- --force]`
if (import.meta.url === `file://${process.argv[1]}`) {
  const root = loadConfig().abs.published;
  const ids = worksNeedingScreenshot(root, process.argv.includes("--force"));
  console.log(`${ids.length} work(s) need a screenshot.`);
  try {
    const { failed } = await captureScreenshots(root, ids, (id, err) =>
      err ? console.error(`  ✗ ${id}: ${err.message}`) : console.log(`  ✓ ${id}`),
    );
    process.exit(failed.length ? 1 : 0);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}
