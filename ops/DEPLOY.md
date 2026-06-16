# Deploy — ai.y-a-v-a.org

The public site is **assembled, not raw**: `npm run build:site` reads
`workspace/published/*` and writes `dist-site/` containing, per work,
`index.html` + `motivation.md` + `meta.json` — and a catalogue `index.html`.
**`jury.json` is never copied** (the private jury verdict stays private). A
regular visitor lands on each work's `index.html`; `motivation.md` is reachable
at `/<id>/motivation.md`.

## One-time setup (your action when ready)

1. **Create a Vercel project** (framework preset: *Other* / static). You can
   link it to the `y-a-v-a/vana` repo or keep it deploy-by-CLI only.
2. **Add three repo secrets** (GitHub → Settings → Secrets → Actions):
   - `VERCEL_TOKEN` — a Vercel access token
   - `VERCEL_ORG_ID` — from the project's `.vercel/project.json` (run `vercel link` once locally) or Vercel settings
   - `VERCEL_PROJECT_ID` — same source
3. **Point the domain:** add `ai.y-a-v-a.org` to the Vercel project's Domains,
   and create the DNS record Vercel shows (CNAME → `cname.vercel-dns.com`).

After that, `.github/workflows/deploy.yml` deploys automatically whenever an
approval pushes a change under `workspace/published/`.

## Simpler alternative (no GitHub Actions)

Use Vercel's native Git integration instead:
- Build Command: `npm run build:site`
- Output Directory: `dist-site`
- Install Command: `npm ci`

Vercel then auto-deploys on every push; `dist-site` is served, so `jury.json`
still never ships. If you choose this, you can delete `deploy.yml`.
