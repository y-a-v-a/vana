# The daemon — going autonomous

`src/daemon.ts` is the long-running process. It:
- serves the approval dashboard continuously (`http://the-machine.taile14d0c.ts.net:4737`)
- wakes every `interval` (default 6h) → generate → jury → (on pass) email you
- is bounded each wake by the work-budget (20 min) and the $ fuse ($5/wake, $20/day)

Run it under launchd so it survives crashes and reboots.

## Going live (your explicit step — this starts autonomous, metered spend)

```sh
# 1. stop any standalone dashboard you started (frees port 4737)
lsof -ti tcp:4737 | xargs kill 2>/dev/null

# 2. install + load the launch agent
cp ops/com.yava.vana.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.yava.vana.plist

# 3. watch it boot
tail -f logs/daemon.out.log
```

By default the first wake is one interval (6h) away. To wake immediately on
load, add `VANA_WAKE_ON_START=1` to your environment (or run a one-off
`npm run once` to test a single cycle without the daemon).

## Stopping

```sh
launchctl unload ~/Library/LaunchAgents/com.yava.vana.plist
```

## Notes
- Secrets come from `.zshenv` via `zsh -lc` in the plist — no secrets are stored
  in the plist or the repo.
- Each wake auto-commits and pushes every candidate (pending *and* rejected) to
  GitHub; approvals (dashboard) push `workspace/published/` which triggers deploy.
- Logs: `logs/daemon.out.log` / `logs/daemon.err.log` (gitignored).
- A single manual cycle without launchd: `npm run once` (bounded by the same
  budget/fuse). For one attempt only: `VANA_MAX_ATTEMPTS=1 npm run once`.
