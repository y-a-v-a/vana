---
name: verify
description: Verify the vana app after changing it. Use aggressively — invoke whenever you touch src/ (generator, jury, loop, dashboard, refine, site, daemon, cost, git, smtp) or config/DNA, to run the right tiered checks (typecheck, tests, live jury, deploy) and make sure the running daemon picks up your changes. Reach for this the moment you finish an edit, not just at the end.
---

# verify — vana's change → validation cycle

vana is an autonomous agent that generates web artworks in `identity/DNA.md`,
juries them (OpenRouter), gates on human approval, and publishes to
`vana.y-a-v-a.org`. It runs as a launchd daemon on this Mac Mini. Architecture:
[`ARCHITECTURE.md`](../../../ARCHITECTURE.md). This skill is how you confirm a
change didn't break it.

**Core principle:** checks are tiered by *cost*. Run the free tier always; run
the paid/live tiers only when you touched the thing they cover. Don't skip the
free tier "because it's a small change."

## Step 1 — Scope the change, pick the tiers

Look at what you edited and map it to checks:

| You touched… | Run |
|---|---|
| anything in `src/` or config | **Tier 0** (always) |
| `jury.ts`, the jury model in `vana.config.json`, or the DNA rubric (`identity/DNA.md` §8) | Tier 0 + **`npm run test:live`** |
| code the daemon runs (`dashboard.ts`, `generator.ts`, `loop.ts`, `refine.ts`, `daemon.ts`, `cost.ts`, `notify.ts`, …) | Tier 0 + **`npm run daemon:restart`** (the daemon runs `tsx` on source — a running instance will NOT pick up your change until restarted) |
| `site.ts`, `vercel.json`, or anything that shapes the public site | Tier 0 + (after pushing) **`npm run verify:deploy`** |
| generation/jury/loop and you want true end-to-end proof | Tier 0 + a guarded live wake (see Step 4) |

## Step 2 — Tier 0: the free gate (always)

```sh
npm run check          # typecheck + node:test suite + build:site
```
Must end green (e.g. `pass NN  fail 0`). This is the same command CI runs on
push, so a green check here means CI will pass too.

- Add/adjust tests for what you changed. Tests are dependency-less
  (`node:test` + `node:assert`) — keep them that way (no Jest, no new test deps).
- Put pure logic behind a tested function; keep integrations thin. Prefer a
  hermetic test (temp dirs, mock req/res — see `dashboard.integration.test.ts`)
  over one that needs the network or real workspace.
- `*.live.ts` files are typechecked but never run by `npm test` (that's the
  paid tier) — don't rename them to `*.test.ts`.

## Step 3 — Tier 1: live jury contract (only if you touched the jury)

```sh
npm run test:live      # one real OpenRouter call (~$0.005); needs OPENROUTER_API_KEY
```
Confirms the configured jury model still exists, returns parseable JSON, and the
verdict assembly holds against the real API. Skips cleanly if the key is absent.

## Step 4 — Live end-to-end (optional, costs money; be deliberate)

Only when a free/hermetic test can't give you confidence (e.g. you changed the
generator prompt or the loop routing):

```sh
VANA_MAX_ATTEMPTS=1 VANA_NO_PUSH=1 npm run once   # one real wake (~$0.40 Opus)
```
- This **generates a real candidate, juries it, and commits it locally** (it
  routes to `workspace/pending` or `rejected`). `VANA_NO_PUSH=1` keeps it off
  GitHub while testing.
- To test a **refine** without disturbing the human's pending queue, copy a
  published work to a temp dir and call `refineCandidate(dir, feedback)` directly
  (cheaper, ~$0.20, no side effects) rather than refining a real pending item.
- Respect the `$` fuse and don't loop this; it's a probe, not a load test.

## Step 5 — Make the running app reflect the change

If you touched code the daemon runs:
```sh
npm run daemon:restart   # reload launchd job so tsx re-reads source
npm run status           # confirm: RUNNING, dashboard 200
```
Then exercise the actual surface you changed, e.g. for a dashboard route:
```sh
id=$(ls -1 workspace/pending | grep -v gitkeep | head -1)
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:4737/candidate/$id"
```
Note: a restart **resets the 6h wake timer** (next autonomous wake is one
interval out). That's expected; mention it to the user.

## Step 6 — Deploy surface (only if you changed the public site)

After pushing (Vercel auto-deploys via native Git integration):
```sh
npm run verify:deploy    # curls vana.y-a-v-a.org: catalogue 200, CSP, work, jury.json 404
```

## Step 7 — Commit + report honestly

- Commit frequently (a commit per coherent unit) and push when appropriate;
  end commit messages with the project's Co-Authored-By line.
- Report what you actually ran and saw. If a check failed, say so with the
  output. Never claim "verified" for something you only typechecked.

## Invariants to re-confirm whenever relevant

These are load-bearing — a change must not regress them:
- **Hard gate:** nothing reaches `workspace/published/` without human Approve.
- **Two vendors:** generator (Anthropic) ≠ jury (OpenRouter).
- **Self-contained:** works make zero external requests (regex first pass in
  `generator.ts` + CSP/sandbox at render). `jury.json` is **never** published.
- **Untrusted ids validated:** HTTP ids pass `isValidId` before touching the FS.
- **Budget is a fuse:** time first, `$` as the backstop.

## What you cannot verify by command

The *visual rendering* and *aesthetic quality* of a generated work, and the
art-approval decision, are the human's. Don't automate the gate; for visual
changes, ask the user to glance at the rendered work (or use a browser/preview
tool if one is available).

---

**If you run into a blocker, find a solution and then update this skill** so the
next session doesn't hit the same wall. This file is meant to improve every time
it's used — add the gotcha, the command, or the step you wished had been here.
