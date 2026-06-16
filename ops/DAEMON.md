# The daemon — going autonomous

`src/daemon.ts` is the long-running process. It:
- serves the approval dashboard continuously (`http://the-machine.taile14d0c.ts.net:4737`)
- wakes every `interval` (default 6h) → generate → jury → (on pass) email you
- is bounded each wake by the work-budget (20 min) and the $ fuse ($5/wake, $20/day)

Run it under launchd so it survives crashes and reboots.

## Operating it (npm scripts)

| Command | What it does |
|---|---|
| `npm run daemon:install` | copy the plist into `~/Library/LaunchAgents/` |
| `npm run daemon:start` | load + enable the launch agent (goes autonomous) |
| `npm run daemon:stop` | unload it |
| `npm run daemon:restart` | reload (use after a **code** change — daemon runs `tsx` on source) |
| `npm run daemon:logs` | `tail -f logs/daemon.out.log` |
| `npm run status` | one-shot health check (launchd state, dashboard, wakes, spend, pending) |
| `npm run once` | run one cycle now, on demand (separate from the schedule) |

## Going live (your explicit step — this starts autonomous, metered spend)

```sh
lsof -ti tcp:4737 | xargs kill 2>/dev/null   # free the dashboard port if needed
npm run daemon:install
npm run daemon:start
npm run daemon:logs
```

By default the first wake is one interval (6h) away. Use `npm run once` to test
a single cycle immediately without waiting for the schedule.

## After a change
- **Code** change (`src/*.ts`): `npm run daemon:restart` (re-reads source).
- **Plist** change (`ops/com.yava.vana.plist`): `npm run daemon:install` then
  `npm run daemon:restart`.

## Stopping

```sh
npm run daemon:stop
```

## Notes
- Secrets come from `.zshenv` via `zsh -lc` in the plist — no secrets are stored
  in the plist or the repo.
- Each wake auto-commits and pushes every candidate (pending *and* rejected) to
  GitHub; approvals (dashboard) push `workspace/published/` which triggers deploy.
- Logs: `logs/daemon.out.log` / `logs/daemon.err.log` (gitignored).
- A single manual cycle without launchd: `npm run once` (bounded by the same
  budget/fuse). For one attempt only: `VANA_MAX_ATTEMPTS=1 npm run once`.
