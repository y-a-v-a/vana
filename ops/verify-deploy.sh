#!/bin/bash
# Tier 2 — verify the live public site after a deploy.
# Usage: npm run verify:deploy [base-url]   (default https://vana.y-a-v-a.org)
# Exits non-zero if any check fails, so it's usable in a pipeline.
set -u
cd "$(dirname "$0")/.." || exit 1
BASE="${1:-https://vana.y-a-v-a.org}"
fail=0

code() { curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$1"; }
expect() { # description expected actual
  if [ "$2" = "$3" ]; then echo "  ok   $1 ($3)"; else echo "  FAIL $1 (expected $2, got $3)"; fail=1; fi
}

echo "verifying $BASE"

expect "catalogue /" 200 "$(code "$BASE/")"

# CSP header present and restrictive (the self-containment backstop)
csp=$(curl -s -D - -o /dev/null --max-time 15 "$BASE/" | grep -i "content-security-policy")
if echo "$csp" | grep -qi "connect-src 'none'"; then
  echo "  ok   CSP present (connect-src 'none')"
else
  echo "  FAIL CSP missing or weak: ${csp:-<none>}"; fail=1
fi

# Probe the oldest published work (certainly deployed)
id=$(ls -1 workspace/published 2>/dev/null | grep -v '^\.gitkeep$' | sort | head -1)
if [ -n "$id" ]; then
  expect "work /$id/" 200 "$(code "$BASE/$id/")"
  expect "motivation /$id/motivation.md" 200 "$(code "$BASE/$id/motivation.md")"
  expect "jury.json stays private /$id/jury.json" 404 "$(code "$BASE/$id/jury.json")"

  # Only the catalogue may load same-origin images; works keep the strict CSP.
  if echo "$csp" | grep -qi "img-src 'self'"; then
    echo "  ok   catalogue CSP allows its thumbnails (img-src 'self')"
  else
    echo "  FAIL catalogue CSP blocks thumbnails: ${csp:-<none>}"; fail=1
  fi
  wcsp=$(curl -s -D - -o /dev/null --max-time 15 "$BASE/$id/" | grep -i "content-security-policy")
  if echo "$wcsp" | grep -qi "img-src data: blob:;"; then
    echo "  ok   work CSP stays strict (img-src data: blob:)"
  else
    echo "  FAIL work CSP loosened or missing: ${wcsp:-<none>}"; fail=1
  fi

  thumb=$(curl -s -D - -o /dev/null --max-time 15 "$BASE/$id/screenshot-480.webp")
  expect "thumbnail /$id/screenshot-480.webp" 200 "$(echo "$thumb" | head -1 | awk '{print $2}')"
  if echo "$thumb" | grep -qi "^cache-control:.*immutable"; then
    echo "  ok   thumbnail cached immutable"
  else
    echo "  FAIL thumbnail not cached immutable"; fail=1
  fi
  expect "full-size PNG stays out /$id/screenshot.png" 404 "$(code "$BASE/$id/screenshot.png")"
else
  echo "  (no published work to probe)"
fi

if [ "$fail" = 0 ]; then echo "DEPLOY OK"; else echo "DEPLOY CHECK FAILED"; fi
exit "$fail"
