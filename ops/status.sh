#!/bin/bash
# vana health check — is the daemon alive, serving, and on schedule?
# Usage: npm run status   (or: bash ops/status.sh)
set -u
cd "$(dirname "$0")/.." || exit 1
LABEL="com.yava.vana"

echo "── launchd ──────────────────────────────"
line=$(launchctl list | awk -v l="$LABEL" '$3==l {print}')
if [ -n "$line" ]; then
  pid=$(echo "$line" | awk '{print $1}')
  exitcode=$(echo "$line" | awk '{print $2}')
  if [ "$pid" != "-" ]; then
    echo "  RUNNING — pid $pid, last exit $exitcode"
  else
    echo "  loaded but NOT running (last exit $exitcode) — KeepAlive should restart it"
  fi
else
  echo "  NOT loaded. Start with:"
  echo "    launchctl load ~/Library/LaunchAgents/$LABEL.plist"
fi

echo "── dashboard ────────────────────────────"
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:4737/ 2>/dev/null || echo down)
echo "  http://localhost:4737 -> $code"

echo "── wakes ────────────────────────────────"
grep -E "wake (start|done|error)|^\[daemon\].* up\." logs/daemon.out.log 2>/dev/null | tail -4 || echo "  no log yet"

echo "── today's spend (fuse) ─────────────────"
if [ -f .vana-state.json ]; then cat .vana-state.json; else echo "  nothing spent today"; fi

echo "── pending awaiting your approval ───────"
ls -1 workspace/pending 2>/dev/null | grep -v '^\.gitkeep$' | sed 's/^/  /' || true
[ -z "$(ls -1 workspace/pending 2>/dev/null | grep -v '^\.gitkeep$')" ] && echo "  (none)"
