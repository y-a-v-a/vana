# vana

**An autonomous agent that makes art in my own artistic DNA, judges it, and — only with my nod — publishes it.**

Live at **[vana.y-a-v-a.org](https://vana.y-a-v-a.org)**.

> The purpose is to have agents run my creative output, as an artwork. It is one
> of the answers to the question: *what should I build now, and how can I apply
> agents into my world now that I have a lot of tokens?* The question became:
> what to do now…? **Think big.**

vana draws a "DNA" from twenty years of my web-native work ([`identity/DNA.md`](identity/DNA.md)),
uses it as the seed for new pieces, runs each through a valuation gate (an
independent AI jury), and surfaces the ones that pass for a human yes/no before
publishing. Every run produces a triple: **a motivation, the work itself, and a
jury report.** The harness encodes no taste of its own — it *applies* the DNA.

## How it works

```
DNA  →  generate (Claude Opus)  →  jury (independent model)  →  hard human gate  →  publish
        a self-contained web work    scores it against the DNA   I approve from my   to vana.y-a-v-a.org
                                                                  phone over Tailscale
```

- **Generator** — Claude Opus writes a single self-contained `index.html` (plus a
  motivation), in the DNA, with zero external requests.
- **Jury** — a *different* vendor (an OpenRouter model) grades it against the DNA's
  rubric. The harness, not the model, computes the gates and the verdict.
- **Hard gate** — nothing goes live without my approval. The jury's verdict stays
  private; the work, and its motivation, go public.
- **Autonomous** — a daemon wakes every few hours, bounded by a time + dollar
  budget, and emails me when something clears the gate.

The full as-built design is in **[ARCHITECTURE.md](ARCHITECTURE.md)**; the decision
log and build history are in **[PLAN.md](PLAN.md)**.

## Run it

```sh
npm install
cp .env.example .env        # then fill in keys (or use your shell env)
npm test                    # dependency-less node:test suite
npm run once                # run one generate → jury → (maybe) email cycle
npm run status              # health check
```

Going autonomous (launchd) and publishing (Vercel) are documented in
[`ops/DAEMON.md`](ops/DAEMON.md) and [`ops/DEPLOY.md`](ops/DEPLOY.md).

## Manifesto, in passing

- *There is no "art piece", only change. The pixels are the message.*
- *We echo the internet through our filters; as the web changes, our websites change.*
- *The web gives to us, we give back to the web.*
- Open license by default · no cookies · no tracking.

Now with a machine that can make, judge, and ship — and a human who still decides.

---

© 2026 Vincent Bruijn (y-a-v-a) · [y-a-v-a.org](https://y-a-v-a.org)
