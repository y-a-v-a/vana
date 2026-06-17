# WISHLIST — vana

Future ideas, none required (the system is live and complete). Add freely; check
off when done. Each item notes the **value** and a rough **effort**. For context
on anything referenced here, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Jury quality
- [ ] **Second-juror consensus** — run a *second* non-Anthropic model and require
  both to clear the gate (or 2-of-3). *Value:* hardens the gate against any single
  model's blind spots. *Effort:* small — at ~$0.0045/verdict it's essentially free;
  add a second `jury.ts` call + an AND on the verdicts. *Effort: S.*
- [ ] **Multimodal jury** — render the work to a screenshot and grade the *pixels*,
  not just the HTML source (D5 currently grades source-as-text). *Value:* catches
  visual failures the source can't reveal. *Effort:* M — needs a headless render
  (Playwright/puppeteer = a dep) and a vision model.
- [ ] **Confidence / abstain** — let the jury flag low-confidence verdicts so
  borderline cases are surfaced differently in the email. *Effort: S.*

## Generation
- [x] **Human-directed refinement** — the dashboard **Refine** action: feedback →
  the agent reworks the candidate in place → re-jury → email. Shipped (`refine.ts`).
- [x] **Learn from rejections** — reject-with-note appends to `identity/guidance.md`,
  which the generator heeds each round. Shipped (`guidance.ts`).
- [ ] **Automatic revision rounds** — the jury-directed variant: on a near-miss,
  feed the jury's `revision_suggestion` back to the generator and re-jury (max K
  attempts) instead of discarding (Q10). *Value:* higher hit-rate per wake.
  *Cost:* more Opus spend; gate on the fuse. *Effort: M.*
- [ ] **Server-side "live" works (P4)** — bots/feeds/APIs the DNA loves but that the
  static-only constraint (Q11) currently excludes. *Value:* unlocks a whole class of
  DNA-native pieces. *Effort: L* — needs hosting beyond static.

## Robustness / ops
- [ ] **Retry on malformed jury JSON** — one re-ask if the model returns unparseable
  output, before failing the wake. *Effort: S.*
- [ ] **Log rotation** — `newsyslog` (or size-capped) for `logs/daemon.*.log`. *Effort: S.*
- [ ] **Cross-process lock** — an `O_EXCL` lockfile so `npm run once` and a scheduled
  daemon wake can never race on git/catalogue/state. *Value:* makes `once` safe to fire
  anytime. *Effort: S* (intentionally skipped for now — race window is tiny).
- [ ] **Daemon "wake now" trigger** — a signal/endpoint to force an immediate daemon
  wake without waiting 6h (vs the separate `npm run once` process). *Effort: S.*

## Security / hardening
- [ ] **HTML parser-based self-containment validator** — the third layer the review
  suggested, beyond the regex first pass + CSP/sandbox. *Value:* structural check vs
  pattern-match. *Effort: M* (parser dep or hand-rolled).
- [ ] **SPF/DKIM for `vincentbruijn.nl` via oni** — current mail delivers, but proper
  records harden deliverability long-term. *Effort: S* (DNS).

## Deploy / housekeeping
- [ ] **Ignored Build Step on Vercel** — only redeploy when `workspace/published/`
  or `src/site.ts` changes, not on every push. *Effort: S* (one Vercel setting).
- [ ] **Tune thresholds & budgets** — revisit `strong≥38` / `borderline≥30` and the
  time/$ budgets as the catalogue grows. *Ongoing.*
- [ ] **Catalogue page polish** — the public index is intentionally minimal; could
  grow into a stronger "living catalogue" work (DNA §9.5). *Effort: M.*

---

*Add new ideas above this line. Keep the value + effort notes so a cold reader (or
future-you) can pick one up without context.*
