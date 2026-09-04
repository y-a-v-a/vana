# The daemon — going autonomous

`src/daemon.ts` is the long-running process. It:
- serves the approval dashboard continuously (`http://the-machine.taile14d0c.ts.net:4737`,
  fronted by HTTPS at `https://the-machine.taile14d0c.ts.net` — see below)
- wakes on the configured schedule → generate → jury → (on pass) email you
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

Use `npm run once` to test a single cycle immediately without waiting for the
schedule; `VANA_WAKE_ON_START=1` makes the daemon wake the moment it boots.

## When it wakes

`vana.config.json` takes either form. A `schedule` block wins when present:

```json
"schedule": { "days": ["mon", "thu", "sat"], "hour": 12, "minute": 0 }
```

Days are `sun`…`sat`; the time is **local wall clock** (Europe/Amsterdam), so a
wake stays at 12:00 across DST. Drop `schedule` to fall back to plain
`"interval": { "hours": N }`, which counts from when the previous wake
*finished* and therefore drifts a few minutes later each cycle.

Either way a restart re-arms from now, so the daemon logs the next wake on
startup — check it with `npm run daemon:logs`:

```
[daemon] … up. wakes=mon,thu,sat at 12:00 …
[daemon] … next wake at 2026-09-05T10:00:00.000Z (Sat Sep 05 2026 12:00:00 GMT+0200)
```

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

## HTTPS for the dashboard

The dashboard itself speaks plain HTTP on `:4737`. Safari refuses to send the
approval form over that, so Tailscale terminates TLS in front of it with a real
Let's Encrypt cert (auto-renewed by `tailscaled`, tailnet-only — this is
`serve`, **not** `funnel`, so nothing is exposed to the public internet):

```sh
TS=/Applications/Tailscale.app/Contents/MacOS/Tailscale   # CLI is not on $PATH
$TS serve --bg --https=443 http://127.0.0.1:4737          # persists across reboots
$TS serve status                                          # inspect
$TS serve --https=443 off                                 # undo
```

Requires MagicDNS + "HTTPS Certificates" enabled for the tailnet. The approval
emails link to whatever `dashboard.baseUrl` is in `vana.config.json`
(`https://the-machine.taile14d0c.ts.net`); drop that key to fall back to
`http://<tailnetHost>:<port>`.
