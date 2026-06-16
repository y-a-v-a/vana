# Deploy — vana.y-a-v-a.org

The public site is **assembled, not raw**: `npm run build:site` reads
`workspace/published/*` and writes `dist-site/` containing, per work,
`index.html` + `motivation.md` + `meta.json` — and a catalogue `index.html`.
**`jury.json` is never copied** (the private jury verdict stays private). A
regular visitor lands on each work's `index.html`; `motivation.md` is reachable
at `/<id>/motivation.md`.

## Setup — Vercel native Git integration (recommended)

1. **Create the project**
   - vercel.com → **Add New… → Project**
   - **Import Git Repository** → `y-a-v-a/vana`
     (if it's not listed, click *Adjust GitHub App Permissions* / *Configure GitHub App*
     and grant Vercel access to the `y-a-v-a` org and the `vana` repo)

2. **Configure build settings** (on the import screen)
   - **Framework Preset:** Other
   - **Build Command:** `npm run build:site`
   - **Output Directory:** `dist-site`
   - **Install Command:** `npm ci`
   - Root Directory: `./` (default). No environment variables needed.

3. **Deploy.** The first build runs `npm run build:site` and serves the current
   catalogue (it'll show "The Original"). You'll get a `*.vercel.app` URL.

4. **Point the domain**
   - Project → **Settings → Domains** → add `vana.y-a-v-a.org`
   - Vercel shows a DNS record (a CNAME to `cname.vercel-dns.com`). Add it at
     wherever `y-a-v-a.org`'s DNS is managed.

That's it. Every push to `main` triggers a rebuild+deploy. When you Approve a
candidate, the dashboard pushes `workspace/published/` → Vercel redeploys with
the new work. `dist-site` is the only thing served, so `jury.json` never ships.

> Optional: to deploy only when published works change (not on every push), set
> an **Ignored Build Step** in Vercel:
> `git diff --quiet HEAD^ HEAD -- workspace/published src/site.ts || exit 1`

## Verifying
- Visit the `*.vercel.app` URL → catalogue index.
- `/<id>/` → the work; `/<id>/motivation.md` → its motivation.
- `/<id>/jury.json` → **404** (must not exist).
