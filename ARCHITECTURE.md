# ARCHITECTURE — vana

The **as-built** description of the system. For the design rationale and the
decision log see [`PLAN.md`](PLAN.md); for the artistic rubric the agents apply
see [`identity/DNA.md`](identity/DNA.md).

vana is a local, interval-driven agent that generates web artworks in the
y-a-v-a artistic DNA, has each one graded by an independent AI jury, gates on a
hard human approval, and publishes the approved subset to `vana.y-a-v-a.org`.
The harness encodes **no taste of its own** — it *applies* `identity/DNA.md`.

## The loop

```
              identity/DNA.md  +  catalogue.json   (operating system + dedup corpus)
                                    │
                                    ▼
        GENERATOR — Claude Opus (Agent SDK)         writes a self-contained candidate:
        ANTHROPIC_API_KEY                            index.html + motivation.md + meta.json
                                    │
                                    ▼
        JURY — OpenRouter (minimax/minimax-m3)       applies DNA §8 → gates + 0–5 scores
        OPENROUTER_API_KEY                           (harness computes weighting + verdict)
                                    │
                 reject / gate-fail │ strong | borderline
            ┌───────────────────────┴───────────────────────┐
            ▼                                                ▼
   workspace/rejected/<id>                         workspace/pending/<id>
   (archived, discarded)                           + auto git commit & push
                                                            │
                                                            ▼
                          EMAIL (authenticated SMTP, agent@vincentbruijn.nl)
                          → Tailscale link to the local approval dashboard
                                                            │
                                            Vincent opens on iOS/Mac over Tailscale
                                                            ▼
                          APPROVAL DASHBOARD (local node:http server, port 4737)
                          renders the work (iframe) + motivation + jury verdict
                          [ Approve ]                       [ Reject ]
                              │                                 │
                              ▼                                 ▼
                  workspace/published/<id>            workspace/rejected/<id>
                  + git commit & push                + git commit & push
                              │
                              ▼
        push to GitHub → Vercel (native Git integration) → build:site → vana.y-a-v-a.org
                          (serves only published/, assembled minus jury.json)
```

### Loop control (time-budgeted, loop-until-pass)

Each wake runs until a candidate passes **or** a budget is hit:

```
wake:
  start a 20-min wall-clock timer and the cost meter
  repeat:
    generate candidate           (~3-4 min, ~$0.37-0.79 Opus)
    jury candidate               (~8s, ~$0.0045 MiniMax)
    if passes gate  → pending/, commit+push, email, STOP
    if time budget exceeded → STOP (nothing this wake)
    if $ fuse tripped → STOP
    else → archive to rejected/, continue
  sleep until next interval (6h)
```

## Components (`src/`)

| Module | Responsibility |
|---|---|
| `config.ts` | Loads `vana.config.json` (zod-validated, absolute paths) + secrets/SMTP from env |
| `dna.ts` | Reads `identity/DNA.md` — the operating system for both agents |
| `catalogue.ts` | `catalogue.json`: living index seeded from DNA §7; `catalogueDigest()` for prompts, `upsertEntry()` for lifecycle; G6 dedup source |
| `ids.ts` | `slugify` + `makeId` → candidate id `<UTC-date>-<title-slug>` |
| `generator.ts` | Runs Opus via the Agent SDK (`claude_code` preset + DNA appended, Read/Write tools, `cwd`-scoped) to write the candidate; `validateSelfContained()` blocks any external request; returns provider-accurate `total_cost_usd` |
| `jury.ts` | One OpenRouter chat call (JSON mode) applying DNA §8; the **model supplies gate booleans + 0–5 scores**, the **harness computes** weighting (§8.2), gate-first logic and thresholds (§8.1/§8.3), and the verdict |
| `cost.ts` | `CostMeter` (persists daily spend to `.vana-state.json`); OpenRouter pricing lookup; `fuseCheck` (per-wake + per-day ceilings) |
| `loop.ts` | `runWake()` — the orchestration above; routes to pending/rejected; writes `jury.json`; upserts the catalogue; `npm run once` entrypoint |
| `git.ts` | Scoped stage (`workspace/` + `catalogue.json`) + commit + optional push; tolerant of an empty commit |
| `smtp.ts` | Dependency-free SMTP-over-implicit-TLS (465) client: RFC 2047 subject, base64 body, 20s timeout, AUTH LOGIN |
| `notify.ts` | `buildEmail()` + `sendCandidateEmail()`; the email is the ping, the dashboard is the gate (the loop never reads an inbox) |
| `dashboard.ts` | `node:http` server: lists `pending/`, renders a candidate (work iframe + motivation + jury), Approve/Reject; status pages for decided candidates; serves `/work` |
| `promote.ts` | `decide(id, approve|reject)` — moves pending→published/rejected, updates the catalogue, commits + pushes. **Approve is the only writer to `published/`.** |
| `site.ts` | `buildSite()` — assembles `dist-site/` for Vercel; copies per-work `index.html` + `motivation.md` + `meta.json`, **never `jury.json`**; writes the catalogue index |
| `daemon.ts` | The long-running process: serves the dashboard continuously **and** self-schedules wakes; launchd target |

Pure logic (ids, self-containment, weighting/thresholds, JSON extraction, email
and SMTP message building, rendering, site assembly) is unit-tested with
`node:test` + `node:assert` — no test framework dependency. `npm test`.

## Data & lifecycle

```
workspace/
  .work/<tmp>/      generator staging (unique mkdtemp; gitignored)
  pending/<id>/     awaiting human approval   { index.html, motivation.md, meta.json, jury.json }
  published/<id>/   approved (served publicly){ index.html, motivation.md, meta.json, jury.json }
  rejected/<id>/    archived, discarded       { index.html, motivation.md, meta.json, jury.json }
catalogue.json      every work + status (historical | pending | published | rejected)
.vana-state.json    daily $ spend for the fuse (gitignored)
```

A candidate is built in `.work/`, juried, then atomically `rename`d into
`pending/` or `rejected/`. Approval renames `pending/`→`published/`. The repo is
the source of truth; the public site is the *assembled, approved* subset.

## Process model

There are two ways a wake runs, and they are **separate OS processes**:

- **The daemon** (`daemon.ts`, under launchd) — one persistent process that
  **owns the dashboard** (binds port 4737) and self-schedules wakes every 6h. An
  in-process flag prevents it overlapping its *own* wakes.
- **`npm run once`** — a short-lived process that runs a single wake and exits.
  It does **not** start a dashboard (no port binding), so it never clashes with
  the daemon's gateway.

They are independent processes that share on-disk state (the git repo,
`catalogue.json`, `.vana-state.json`). If a manual `once` is fired in the same
~4-minute window as a scheduled daemon wake, they can race on the git
index/push and those files (symptom: a git `index.lock` or a rejected push in
one of them — recoverable, not corrupting). The window is small (the daemon
wakes ~4 min once every 6h); `npm run status` shows whether a wake is in flight.
A cross-process lockfile would make this airtight but was judged unnecessary.

## The two agents (division of labour)

The generator and the jury are **always different vendors** so no model grades
its own output. The generator is Claude Opus (via the Agent SDK, which gives it
a real file-writing tool loop). The jury is a single non-Anthropic OpenRouter
model (`minimax/minimax-m3`, configurable) doing one structured call. Crucially
the jury only supplies *judgements*; all arithmetic and the pass/fail decision
are computed deterministically in `jury.ts`, so the gate is testable and not at
the mercy of a model doing weighted sums.

Cost asymmetry: generation is ~99% of the spend (~$0.37–0.79/work), the jury is
~$0.0045/verdict. The $ fuse therefore mostly bounds *Opus generations*.

## Budget, scheduling, resilience

- **Time budget:** 20 min wall-clock per wake (loop-until-pass within it).
- **$ fuse:** $5/wake and $20/day, computed from real token usage (`total_cost_usd`
  for the generator, OpenRouter pricing × usage for the jury). A trip stops the wake.
- **Schedule:** every 6h, via the daemon's own timer.
- **Resilience:** launchd `RunAtLoad` + `KeepAlive` restart the daemon on crash
  and on reboot. Secrets reach it because the plist runs `zsh -lc`, which sources
  `.zshenv`.

## Configuration & secrets

- `vana.config.json` — interval, work budget, `$` fuse, model ids, lifecycle
  paths, `thresholds`, dashboard port + tailnet host, email recipient, git remote/branch.
- Secrets from the environment (`.zshenv`): `ANTHROPIC_API_KEY` (generator),
  `OPENROUTER_API_KEY` (jury), and `ONI_MAIL_SERVER` / `ONI_MAIL_ADDRESS` /
  `ONI_MAIL_PASSWORD` (SMTP, port 465). No secrets in the repo or the plist.

## Infrastructure

- **Host:** a Mac Mini ("the-machine"); `node` at `/usr/local/bin/node`, run with `tsx`.
- **Reachability:** the dashboard is private behind **Tailscale** (no auth of its
  own — the tailnet is the perimeter); reached at `the-machine.taile14d0c.ts.net:4737`.
- **Email:** authenticated SMTP from `agent@vincentbruijn.nl` via `mail.oni.nl:465`.
- **Publish:** GitHub (`y-a-v-a/vana`) → Vercel native Git integration
  (build `npm run build:site`, output `dist-site`) → `vana.y-a-v-a.org`.

## Operating it

| Command | Purpose |
|---|---|
| `npm test` / `npm run typecheck` | unit tests / type check |
| `npm run once` | run one wake now, on demand |
| `npm run status` | health: launchd state, dashboard, recent wakes, today's spend, pending |
| `npm run daemon:start` / `:stop` / `:restart` | launchd lifecycle (restart after a code change) |
| `npm run daemon:logs` | tail the live log |
| `npm run build:site` | assemble `dist-site/` locally |

See [`ops/DAEMON.md`](ops/DAEMON.md) and [`ops/DEPLOY.md`](ops/DEPLOY.md).

## Invariants

- **The hard gate is sacred** — nothing reaches `published/` (and the live site)
  without an Approve click. The loop is write-only to `pending/` and `rejected/`.
- **Two vendors, always** — generator ≠ jury.
- **Self-contained or it fails** — any external request in a work is a gate failure.
- **`jury.json` is private** — committed as the record, never published to the site.
- **DNA.md is the only taste authority** — tune the rubric there, not in code.
- **The budget is a fuse, not a target** — time first, dollars as the backstop.
