# Polaris Docs

User documentation for Polaris Finance (the pETH-powered yield layer for DeFi). Nextra 4 on Next.js 16 App Router, statically exported to GitHub Pages.

## Structure

- `content/<topic>/*.mdx` — all docs pages (topics: core-assets, architecture, design, testnet, risks) plus top-level .mdx pages (index, manifesto, why-peth, vision, developers).
- `_meta.js` in `content/` and each topic folder drives sidebar titles/order; register new pages there.
- `app/` — layout.jsx, `[[...mdxPath]]` catch-all route, site-config.mjs.
- `public/` — assets + generated artifacts (.md mirrors, llms*.txt, sitemap, `_pagefind/`).
- Config: `next.config.mjs`, `mdx-components.js`, eslint/prettier/playwright configs; helpers in `scripts/`.

## Commands

- `npm run dev` — http://localhost:3000/polaris-docs/
- `npm run build` — static export to `./out` + Pagefind index (must stay `next build --webpack`)
- `npm run lint`, `npm run lint:content`, `npm run check:links`
- `npm run ci` — full local gate

## Deploy

Push to `main` → `.github/workflows/deploy.yml` → GitHub Pages at polaris-finance.github.io/polaris-docs (`BASE_PATH=/polaris-docs`). `ci.yml` validates PRs. Not Cloudflare.

## Rules

- For a content task, read only the relevant content/<topic>/ folder — never sweep the whole content tree.
- MDX: no `> [!NOTE]` callouts or `<!-- -->` comments; use `> **Note:**` and `{/* ... */}`.
- Keep the `zod` 4.1.12 override in package.json (Nextra 4.6.1 prerender breaks on newer zod).
