# PLAN.md — vana: an autonomous art-generating agent harness

> A local, interval-driven agent loop that generates self-contained web artworks in
> Vincent Bruijn / y-a-v-a's artistic DNA, has them graded by an independent AI jury,
> and — only after human approval — publishes them to `ai.y-a-v-a.org`.
>
> Source of artistic truth: [`identity/DNA.md`](identity/DNA.md). The harness does not
> encode taste; it *applies* the DNA document.
>
> Status: **design locked, not yet implemented.** This file is the fallback record of
> every architectural decision. Update it when decisions change.

---

## 1. Vision (from README.md)

Agents run Vincent's creative output *as the artwork itself*. The harness draws a "DNA"
from his existing body of work, uses it as the seed for new pieces, runs each piece
through a valuation gate (the "jury"), and — on passing — surfaces it for a human
yes/no before automatic deployment. Every run emits a triple: **motivation + the work +
jury report.**

---

## 2. The loop (architecture)

```
                          ┌──────────────────────────────────┐
                          │  identity/DNA.md   (read-only)    │
                          │  catalogue.json    (living index) │
                          └───────────────┬──────────────────┘
                                          │ seed + dedup corpus (G6)
                                          ▼
            ╔═════════════════════════════════════════════════════╗
            ║  GENERATOR  —  Claude Opus via Agent SDK             ║
            ║  ANTHROPIC_API_KEY                                   ║
            ║  writes a self-contained index.html + motivation.md  ║
            ╚═══════════════════════════┬═════════════════════════╝
                                        │ candidate
                                        ▼
            ╔═════════════════════════════════════════════════════╗
            ║  JURY  —  OpenRouter (configurable, non-Anthropic)   ║
            ║  OPENROUTER_API_KEY                                  ║
            ║  applies DNA §8 → structured verdict JSON (§8.4)     ║
            ╚═══════════════════════════┬═════════════════════════╝
                                        │
                    ┌───────────────────┴───────────────────┐
              reject / gate fail                      strong | borderline
                    │                                       │
                    ▼                                       ▼
            rejected/<id>/                          pending/<id>/
            (archived, discarded)                   + git commit & push
                                                            │
                                                            ▼
                                  ┌─────────────────────────────────────────┐
                                  │  EMAIL  (Mail.app via osascript)         │
                                  │  → Tailscale link to local dashboard     │
                                  └─────────────────────┬───────────────────┘
                                                        │  Vincent opens on iOS/Mac
                                                        ▼
                                  ┌─────────────────────────────────────────┐
                                  │  APPROVAL DASHBOARD (local web server)   │
                                  │  renders work + motivation + jury JSON   │
                                  │  [ Approve ]   [ Reject ]                │
                                  └─────────────────────┬───────────────────┘
                                            approve      │
                                                        ▼
                                            published/<id>/  + git commit & push
                                                        │
                                                        ▼
                              GitHub Actions  ──▶  Vercel deploy  ──▶  ai.y-a-v-a.org
                                            (serves only published/ — the approved subset)
```

### Loop control (time-budgeted, loop-until-pass)

```
every INTERVAL (default 6h):
    wake
    start wall-clock timer (default 20 min) and cost meter
    repeat:
        generate candidate
        jury candidate
        if passes gate:           → pending/, commit+push, email, BREAK
        if wall-clock exceeded:   → BREAK (no candidate this wake)
        if $ fuse tripped:        → BREAK + alert
        else:                     → archive reject, continue
    sleep until next INTERVAL
```

---

## 3. Locked decisions

| # | Decision | Value | Rationale |
|---|----------|-------|-----------|
| Q1 | Medium | Self-contained `index.html` (HTML/SVG/canvas/JS or conceptual text) | Unifies all forms; statically hostable |
| Q2 | DNA source | [`identity/DNA.md`](identity/DNA.md) | Already authored; encodes jury rubric §8 |
| Q3 | Jury type | AI model (LLM) | Per vision |
| Q4 | Cadence | Interval-driven, budget-aware | — |
| Q5 | Runtime | Local Mac Mini; auto git commit + push each iteration | — |
| Q6 | Providers | Anthropic (generator) + OpenRouter (jury) | Two vendors |
| Q7 | Human gate | **Hard gate** — nothing live without approval | DNA §9.3 |
| Q8 | Budget | **Time-based per wake + $ fuse** | Wall-clock throttle, cost backstop |
| Q9 | Iteration | **(c) loop-until-pass**, then sleep | — |
| Q10 | On reject | **Discard**, archive to `rejected/` | Keep history honest |
| Q11 | Constraint | Self-contained, client-side only (no server/bot/feed works in v1) | Static deploy |
| Q12 | Notify | Email to vebruijn@gmail.com via Mail.app + osascript | — |
| Q13 | Multi-model | **Division of labor** (Opus generates, OpenRouter juries) | Reduce self-flattery |
| Q14 | Language | **TypeScript** (JS-native, Node 24) | One language end-to-end; no Python |
| Q15 | Defaults | Interval 6h, work budget 20 min/wake | Editable in config |
| Q16 | Jury model | **OpenRouter only, configurable**, single juror | Max independence |
| Q17 | Approval UX | Email ping → **Tailscale-served local dashboard** with Approve/Reject | Loop stays write-only; no inbox reading |
| Q18 | Repo | Existing `vana` → `git@github.com:y-a-v-a/vana.git` (main) | Already wired |
| Q19 | Deploy | Push `published/` → **GitHub Actions → Vercel** | Push *is* deploy |
| D1 | Work artifact | Single self-contained `index.html`, zero external requests | Also satisfies G4 (no cookies/trackers) |
| D2 | Impl split | Generator = Agent SDK loop; Jury = plain OpenRouter JSON call | Jury needs no agent loop |
| D3 | Process | One persistent Node daemon under macOS **launchd** | Serves dashboard + self-schedules wakes; restarts on crash/reboot |
| D4 | Dashboard auth | None — **Tailscale is the perimeter** | Private tailnet only |
| D5 | Jury input | HTML **source as text** in v1 | Screenshot/multimodal grading = later upgrade |
| D6 | Dedup | `catalogue.json` seeded from DNA §7; all candidates appended with status | Both agents read for G6 |
| D7 | $ fuse | **$5/wake, $20/day** (default, editable) | Cost backstop atop time budget |

### Open / deferred
- Jury model id: pick a strong **non-Anthropic** OpenRouter model for independence (set in config).
- `OPENROUTER_API_KEY` is **not yet set in env** — required before first run.
- Tailscale CLI not on PATH (Mac App Store build); daemon assumed running — detect tailnet host at runtime or set in config.
- Public domain `ai.y-a-v-a.org` → Vercel project + CNAME wiring (deploy-time, not harness-blocking).
- Upgrades noted for later: multimodal jury (screenshot), second juror w/ consensus, revision rounds, server-side "live" works (P4 bots/feeds/APIs).

---

## 4. Repository layout (target)

```
vana/
  identity/DNA.md            # operating system (read-only to agents)
  PLAN.md                    # this file
  catalogue.json             # living index: shipped + pending + rejected (G6 source)
  vana.config.json           # interval, budgets, model ids, paths, tailnet host
  .env                       # ANTHROPIC_API_KEY, OPENROUTER_API_KEY  (gitignored)
  package.json / tsconfig.json
  src/
    daemon.ts                # entrypoint: scheduler + dashboard server (launchd target)
    loop.ts                  # loop-until-pass controller + budget/fuse
    generator.ts             # Agent SDK (Opus) → writes candidate
    jury.ts                  # OpenRouter call → DNA §8.4 verdict
    catalogue.ts             # seed/load/append; dedup helpers
    git.ts                   # commit + push helpers
    notify.ts                # Mail.app via osascript
    dashboard/               # local web app: list pending, render, Approve/Reject
    promote.ts               # pending/<id> → published/<id> (+ commit/push)
    cost.ts                  # token→$ meter, fuse logic
  workspace/                 # "where the freedom to work lies" — agent lifecycle dirs
    pending/<id>/   { index.html, motivation.md, jury.json }
    published/<id>/ { index.html, motivation.md, jury.json }
    rejected/<id>/  { index.html, motivation.md, jury.json }
  .github/workflows/deploy.yml   # on push touching workspace/published/ → Vercel
  ops/com.yava.vana.plist        # launchd unit
```

> **Scaffold note (Phase 0):** the candidate lifecycle dirs live under `workspace/`
> (honoring "the workspace directory is where the freedom to work lies"). `src/` stays
> at repo root. `zod` is pinned to **v4** (peer requirement of the Agent SDK). Runtime
> via **tsx** (esbuild). Dashboard default port **4737**.

Candidate `id` = `<UTC-date>-<title-slug>` (e.g. `2026-06-16-but-is-it-art`).

---

## 5. Component contracts

**Generator** (`generator.ts`)
- Input: `DNA.md`, `catalogue.json`.
- Must: produce one self-contained `index.html` + `motivation.md` (principles invoked by ID, ≥1 named reference, mechanism described — per DNA §0/§9.1).
- Tools: filesystem write scoped to the candidate dir only.
- Model: `claude-opus-4-8` (Anthropic).

**Jury** (`jury.ts`)
- Input: candidate `index.html` (source), `motivation.md`, `catalogue.json`.
- Output: exactly the DNA §8.4 JSON (gates, scores, weighted_total, verdict, …). Validated against schema; retry on malformed.
- Gate logic: any hard-gate fail (G1–G6) ⇒ reject regardless of score. Thresholds DNA §8.3: ≥38 strong, 30–37 borderline, <30 reject.
- Model: configurable OpenRouter id (non-Anthropic recommended). **Different vendor than generator.**

**Loop/budget** (`loop.ts`, `cost.ts`)
- Wall-clock cap per wake (default 20 min) + $ fuse (default $5/wake, $20/day) from accumulated API token usage.
- Loop-until-pass; on pass → pending + commit/push + email; on timeout/fuse → sleep.

**Gateway** (`notify.ts`, `dashboard/`, `promote.ts`)
- Email = notification only (osascript → Mail.app), body links to the Tailscale dashboard URL for that candidate.
- Dashboard renders the live `index.html`, the motivation, and the jury JSON; Approve → `promote.ts`; Reject → archive.
- Hard gate: only Approve writes to `published/`.

**Deploy** (`.github/workflows/deploy.yml`)
- Trigger on push touching `published/**` → Vercel deploy of the published catalogue to `ai.y-a-v-a.org`.

---

## 6. Implementation tasklist

### Phase 0 — Scaffold  ✅
- [x] `npm init`, TypeScript + tsconfig (Node 24, ESM, tsx runtime), `.gitignore`
- [x] Install Agent SDK; OpenRouter via built-in `fetch` (no extra dep); zod v4, dotenv
- [x] `vana.config.json` (interval, work-budget, `$`/wake + `$`/day, model ids, paths, tailnet host)
- [x] `.env.example` documenting `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`
- [x] Create `workspace/{pending,published,rejected}/` + `logs/` with `.gitkeep`
- [x] `src/config.ts`: typed config + secrets loader (zod-validated, absolute paths)
- [x] Verified: `tsc` clean, config loads, dirs present

### Phase 1 — Catalogue & DNA
- [x] `catalogue.ts`: seed `catalogue.json` from DNA §7 (23 historical entries) — verified
- [x] Load catalogue + `catalogueDigest()` for prompting; `upsertEntry()` for lifecycle
- [x] `dna.ts`: DNA.md loader (used as generator/jury operating system)
- [x] `ids.ts`: `slugify` + `makeId` (`<UTC-date>-<slug>`) — tested

### Phase 2 — Generator  ✅ (code; live run pending)
- [x] `generator.ts`: Agent SDK (Opus), `claude_code` preset + DNA append, Read/Write tools, `cwd`-scoped
- [x] Task prompt = constraints + §8 gates + catalogue digest → `index.html` + `motivation.md` + `meta.json`
- [x] `validateSelfContained()` enforces no external requests; `parseMeta()` (zod) — tested
- [x] Unit tests via `node:test` + `node:assert` (16 passing); `npm test`
- [x] Live smoke run verified: produced a self-contained Yves Klein *Zone de Sensibilité* piece in ~200s, 0 violations (≈200s/generation ⇒ ~6 attempts fit a 20-min wake)

### Phase 3 — Jury  ✅ (code; live run blocked on key)
- [x] `jury.ts`: OpenRouter call (fetch, JSON mode) applying DNA §8 → model judgments
- [x] Deterministic in code (not trusted to LLM): weighting (§8.2), gate-first + thresholds (§8.1/§8.3), verdict
- [x] `extractJson()` robust to fences/prose; zod-validated model reply; returns token usage for the fuse
- [x] 14 jury unit tests (suite now 30 passing)
- [ ] Live jury run — **BLOCKED: `OPENROUTER_API_KEY` not set**
- [ ] Persist `jury.json` beside candidate — handled in Phase 4 loop
- [ ] (follow-up) one retry on malformed jury JSON — add in Phase 4 error handling

### Phase 4 — Loop & budget
- [ ] `cost.ts`: token→$ meter from API usage; per-wake + per-day fuse
- [ ] `loop.ts`: loop-until-pass within wall-clock budget; route pass/reject
- [ ] Scheduler: wake every `interval`; sleep between

### Phase 5 — Persistence
- [ ] `git.ts`: stage + commit (descriptive message) + push to origin/main each iteration
- [ ] Verify push works headlessly (SSH key/agent available to launchd)

### Phase 6 — Notify
- [ ] `notify.ts`: osascript → Mail.app, send to vebruijn@gmail.com
- [ ] Email body: title, verdict summary, Tailscale dashboard deep-link

### Phase 7 — Approval gateway
- [ ] `dashboard/`: local web server; list `pending/`, render work + motivation + jury
- [ ] Approve/Reject endpoints; `promote.ts` moves pending→published (+ commit/push)
- [ ] Bind to Tailscale host; confirm reachable from iOS

### Phase 8 — Deploy
- [ ] Vercel project pointed at `published/`; `ai.y-a-v-a.org` CNAME
- [ ] `.github/workflows/deploy.yml`: on push to `published/**` → Vercel deploy

### Phase 9 — Ops
- [ ] `ops/com.yava.vana.plist` launchd unit (KeepAlive, logs)
- [ ] Log rotation / stdout+stderr to file; load + smoke-test the daemon

### Phase 10 — End-to-end dry run
- [ ] Set `OPENROUTER_API_KEY`; one full wake → candidate → jury → pending → email → dashboard → approve → publish → deploy
- [ ] Tune thresholds/budgets with Vincent; record changes back into this file

---

## 7. Guardrails / invariants
- **Hard gate is sacred:** nothing reaches `published/` (and thus the live site) without an Approve click. The loop is write-only to `pending/` and `rejected/`.
- **Two vendors, always:** generator (Anthropic) ≠ jury (OpenRouter). Never let a model grade its own output.
- **Self-contained or it fails:** any external request in a work is a G4/G8 violation; reject.
- **DNA.md is the only taste authority.** Tune the rubric *there*, not in code.
- **Budget is a fuse, not a target:** time first, dollars as backstop. On fuse trip, stop and alert.
```
