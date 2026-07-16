# Polaris Documentation

User documentation for [Polaris](https://polarisfinance.io) - the onchain yield layer built around pETH. Built with [Nextra 4](https://nextra.site) (Next.js App Router), statically exported and deployed to GitHub Pages at **polaris-finance.github.io/polaris-docs**.

Content lives as MDX in [`content/`](./content); the sidebar is driven by `_meta.js` files. No SaaS backend - the docs are fully git-native.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000/polaris-docs/  (Turbopack)
```

Use Node 22 (`.nvmrc` / `.node-version`). CI uses the same major version.

Search in `next dev` uses the last built Pagefind index. If the search panel says the
index is missing, run `npm run dev:search` once, or run `npm run build` and restart
`npm run dev`.

## Build

```bash
npm run build      # static export to ./out  +  Pagefind search index
npm run serve      # preview ./out at http://127.0.0.1:4173/polaris-docs/
```

## Validate

```bash
npm run lint:content          # frontmatter, MDX gotchas, unresolved TODOs
npm run check:links           # local routes, anchors, and public assets
npm run check:links:external  # also checks outbound links over the network
npm run check:artifact         # smoke-check the generated ./out artifact
npm run check:live-artifact    # smoke-check a deployed Pages URL
npm run ci                    # content check + links + build + Pagefind smoke + prod audit
npm run local:push-gate       # local mirror of the reproducible deploy build job
```

Pull requests run the validation workflow in `.github/workflows/ci.yml`. The deploy workflow runs the same local validation before uploading `out/` to GitHub Pages.

## Local push gate

This repo includes a tracked pre-push hook in `.githooks/pre-push`. Enable it in a checkout with:

```bash
git config core.hooksPath .githooks
```

The hook runs `npm run local:push-gate` before branch pushes. It mirrors the locally reproducible required checks from `.github/workflows/deploy.yml`: clean install, Playwright browser install, source checks, static export build, artifact/Pagefind/navigation/e2e checks, production dependency audit, and external-link checking as a non-blocking warning. GitHub-only parallel job scheduling plus the final Pages upload/deploy actions are not run locally.

Useful overrides:

```bash
SKIP_LOCAL_PUSH_GATE=1 git push              # emergency bypass
LOCAL_PUSH_GATE_SKIP_INSTALL=1 git push      # keep node_modules for a faster local retry
LOCAL_PUSH_GATE_WITH_BROWSER_DEPS=1 git push # also install Playwright system deps
npm run local:push-gate:strict-node          # fail unless the shell matches .nvmrc
```

## Important build constraints

Two non-obvious requirements - do not "fix" these without testing:

1. **`zod` is pinned to `4.1.12`** via `overrides` in `package.json`. Nextra 4.6.1's `<Layout>` validates props with a schema where a _missing_ (vs present-but-undefined) `children` key is rejected by zod 4.4.x, breaking every page at static-export prerender time. 4.1.12 tolerates it.
2. **The build uses `next build --webpack`.** Next 16 defaults `build` to Turbopack, which mis-compiles Nextra's React Server Components and fails the prerender. Dev mode (Turbopack) is fine.

Other notes:

- `app/not-found.jsx` is required for the optional catch-all route under `output: 'export'`.
- The Pagefind `postbuild` writes to `out/_pagefind/` for the exported site and syncs a git-ignored copy to `public/_pagefind/` so Nextra search also works in `next dev`.
- MDX gotchas in this config: do **not** use GitHub-style `> [!NOTE]` callouts or `<!-- -->` HTML comments - use `> **Note:**` blockquotes and `{/* ... */}` comments.
- Public GitHub edit/feedback links are intentionally disabled until the repository remote, default branch, and issue routing are live. Re-enable `projectLink`, `docsRepositoryBase`, `editLink`, and `feedback` in `app/layout.jsx` only after the links resolve.

## Authoring

- Follow the Polaris voice and spelling conventions: Polaris, onchain, DeFi, pETH/fpETH/vpETH lowercase `p`, USDp/GOLDp trailing `p`, pAsset, Earn Vault, and position.
- Add a page: create `content/<section>/<page>.mdx` and register its title/order in the section's `_meta.js`.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml` (source checks, production audit, external links, and project-path build/Pagefind/artifact checks in parallel → GitHub Pages deploy after required gates pass). Before the first deploy:

0. Rename the local default branch to `main`, add the GitHub remote, and confirm the public repository URL. The initial local branch is currently not sufficient for deployment.
1. In the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.
2. Keep `BASE_PATH=/polaris-docs` and `SITE_URL=https://polaris-finance.github.io` in the deploy workflow while the production URL is `https://polaris-finance.github.io/polaris-docs/`.

The site is deployed as a GitHub Pages project site. Treat `https://polaris-finance.github.io/polaris-docs/` as canonical. The source defaults and deploy workflow both build with `SITE_URL=https://polaris-finance.github.io` and `BASE_PATH=/polaris-docs`; there is no `public/CNAME` while `docs.polarisfinance.io` is not validated as serving this repo and may serve stale or unrelated content. Do not switch to root custom-domain settings until that host is confirmed to serve this docs build. If the docs later move to a working root custom domain, set `BASE_PATH=` and `SITE_URL` to that origin, then restore a matching `public/CNAME`.
