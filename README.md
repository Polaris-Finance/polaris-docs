# Polaris Documentation

User documentation for [Polaris Finance](https://polarisfinance.io) — the self-scaling stablecoin operating system. Built with [Nextra 4](https://nextra.site) (Next.js App Router), statically exported and deployed to GitHub Pages at **docs.polarisfinance.io**.

Content lives as MDX in [`content/`](./content); the sidebar is driven by `_meta.js` files. No SaaS backend — the docs are fully git-native.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000  (Turbopack)
```

Use Node 22 (`.nvmrc` / `.node-version`). CI uses the same major version.

Search in `next dev` uses the last built Pagefind index. If the search panel says the
index is missing, run `npm run dev:search` once, or run `npm run build` and restart
`npm run dev`.

## Build

```bash
npm run build      # static export to ./out  +  Pagefind search index
npm run serve      # preview the exported ./out locally
```

## Validate

```bash
npm run lint:content          # frontmatter, MDX gotchas, unresolved TODOs
npm run check:links           # local routes, anchors, and public assets
npm run check:links:external  # also checks outbound links over the network
npm run ci                    # content check + links + build + Pagefind smoke + prod audit
npm run local:push-gate       # local mirror of the reproducible deploy build job
```

Pull requests run the validation workflow in `.github/workflows/ci.yml`. The deploy workflow runs the same local validation before uploading `out/` to GitHub Pages.

## Local push gate

This repo includes a tracked pre-push hook in `.githooks/pre-push`. Enable it in a checkout with:

```bash
git config core.hooksPath .githooks
```

The hook runs `npm run local:push-gate` before branch pushes. It mirrors the locally reproducible part of `.github/workflows/deploy.yml`: clean install, Playwright browser install, `npm run ci`, external-link checking as a non-blocking warning, and the Pages artifact smoke check. The final GitHub Pages upload/deploy actions require GitHub's Pages environment and are not run locally.

Useful overrides:

```bash
SKIP_LOCAL_PUSH_GATE=1 git push              # emergency bypass
LOCAL_PUSH_GATE_SKIP_INSTALL=1 git push      # keep node_modules for a faster local retry
LOCAL_PUSH_GATE_WITH_BROWSER_DEPS=1 git push # also install Playwright system deps
npm run local:push-gate:strict-node          # fail unless the shell matches .nvmrc
```

## Important build constraints

Two non-obvious requirements — do not "fix" these without testing:

1. **`zod` is pinned to `4.1.12`** via `overrides` in `package.json`. Nextra 4.6.1's `<Layout>` validates props with a schema where a *missing* (vs present-but-undefined) `children` key is rejected by zod 4.4.x, breaking every page at static-export prerender time. 4.1.12 tolerates it.
2. **The build uses `next build --webpack`.** Next 16 defaults `build` to Turbopack, which mis-compiles Nextra's React Server Components and fails the prerender. Dev mode (Turbopack) is fine.

Other notes:

- `app/not-found.jsx` is required for the optional catch-all route under `output: 'export'`.
- The Pagefind `postbuild` writes to `out/_pagefind/` for the exported site and syncs a git-ignored copy to `public/_pagefind/` so Nextra search also works in `next dev`.
- MDX gotchas in this config: do **not** use GitHub-style `> [!NOTE]` callouts or `<!-- -->` HTML comments — use `> **Note:**` blockquotes and `{/* ... */}` comments.
- Public GitHub edit/feedback links are intentionally disabled until the repository remote, default branch, and issue routing are live. Re-enable `projectLink`, `docsRepositoryBase`, `editLink`, and `feedback` in `app/layout.jsx` only after the links resolve.

## Authoring

- Follow the Polaris voice & spelling conventions (onchain, DeFi, pUSD/pETH lowercase `p`, logical arrow `⇒`, **trove** not vault, T-bills). See the content guide in the `polaris-content` repo.
- Each concept page ends with a **Go deeper →** link to the matching essay on the [Polaris blog](https://polarisfinance.io/blog).
- Add a page: create `content/<section>/<page>.mdx` and register its title/order in the section's `_meta.js`.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml` (build → Pagefind → GitHub Pages). Before the first deploy:

0. Rename the local default branch to `main`, add the GitHub remote, and confirm the public repository URL. The initial local branch is currently not sufficient for deployment.
1. In the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.
2. Add a DNS **CNAME** record: `docs` → `<org>.github.io`. The `public/CNAME` file pins the custom domain; `public/.nojekyll` lets GitHub Pages serve the `_next/` assets.

The site is configured for a root custom domain, so no `basePath` is set. If you ever deploy to a project subpath instead (`<org>.github.io/polaris-docs`), add `basePath`/`assetPrefix` to `next.config.mjs`.
