import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handle } from "./dashboard.ts";
import type { Config } from "./config.ts";

// Drives the real request handler against a temp fixture with no socket and no
// real workspace — fully hermetic, so it runs free in CI. This codifies the
// route/CSP/sandbox/traversal checks that were previously done by hand with curl.

interface MockRes {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  writeHead(code: number, headers?: Record<string, string>): MockRes;
  end(chunk?: string): void;
}

function mockRes(): MockRes {
  return {
    statusCode: 0,
    headers: {},
    body: "",
    writeHead(code, headers) {
      this.statusCode = code;
      if (headers) Object.assign(this.headers, headers);
      return this;
    },
    end(chunk) {
      if (chunk) this.body += chunk;
    },
  };
}

function fixtureConfig(root: string): Config {
  return {
    abs: {
      root,
      pending: join(root, "pending"),
      published: join(root, "published"),
      rejected: join(root, "rejected"),
      dna: join(root, "DNA.md"),
      catalogue: join(root, "catalogue.json"),
    },
  } as unknown as Config;
}

async function request(cfg: Config, url: string): Promise<MockRes> {
  const res = mockRes();
  const req = { method: "GET", url } as unknown as IncomingMessage;
  await handle(req, res as unknown as ServerResponse, cfg);
  return res;
}

test("dashboard handler: routes, CSP, sandbox, traversal", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "vana-dash-it-"));
  try {
    const id = "2026-06-16-fixture-work";
    const dir = join(root, "pending", id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), "<!doctype html><h1>FIXTURE_WORK</h1>");
    writeFileSync(join(dir, "motivation.md"), "the motivation");
    writeFileSync(
      join(dir, "meta.json"),
      JSON.stringify({
        title: "Fixture Work",
        summary: "a fixture",
        mechanism: "m",
        principles: ["P1"],
        references: ["R"],
        license: "CC BY-SA 4.0",
      }),
    );
    writeFileSync(
      join(dir, "jury.json"),
      JSON.stringify({
        work_id: id,
        gates: { G1: true, G2: true, G3: true, G4: true, G5: true, G6: true },
        scores: { novelty: 4, nuance: 4, narrative: 4, craft: 4, wit: 4 },
        weighted_total: 40,
        verdict: "strong",
        references_named: ["R"],
        principles_invoked: ["P1"],
        rationale: "ok",
        reservations: null,
        revision_suggestion: null,
        jury_model: "test",
      }),
    );
    const cfg = fixtureConfig(root);

    await t.test("GET / lists the pending candidate", async () => {
      const r = await request(cfg, "/");
      assert.equal(r.statusCode, 200);
      assert.match(r.body, /Pending \(1\)/);
      assert.match(r.body, /Fixture Work/);
    });

    await t.test("GET /candidate/:id renders a sandboxed iframe", async () => {
      const r = await request(cfg, `/candidate/${id}`);
      assert.equal(r.statusCode, 200);
      assert.match(r.body, /sandbox="allow-scripts allow-downloads"/);
      assert.match(r.body, /the motivation/);
    });

    await t.test("GET /candidate/:id/work serves the work with the CSP header", async () => {
      const r = await request(cfg, `/candidate/${id}/work`);
      assert.equal(r.statusCode, 200);
      assert.match(r.body, /FIXTURE_WORK/);
      assert.match(r.headers["Content-Security-Policy"] ?? "", /connect-src 'none'/);
      assert.match(r.headers["Content-Security-Policy"] ?? "", /default-src 'none'/);
    });

    await t.test("traversal id → 404 (not a file read)", async () => {
      const r = await request(cfg, `/candidate/${encodeURIComponent("../../etc/passwd")}/work`);
      assert.equal(r.statusCode, 404);
      assert.doesNotMatch(r.body, /root:.*:0:0/);
    });

    await t.test("unknown id → 303 redirect to landing", async () => {
      const r = await request(cfg, "/candidate/2026-01-01-does-not-exist");
      assert.equal(r.statusCode, 303);
      assert.equal(r.headers["Location"], "/");
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
