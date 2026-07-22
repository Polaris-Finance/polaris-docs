# Contributing

Thanks for helping improve the Polaris docs. The short version:

## Setup

```sh
npm ci
npm run dev   # http://localhost:3000/
```

## Where things live

- `content/<topic>/*.mdx` — all docs pages; `_meta.js` files drive sidebar titles and order.
- `app/`, `components/` — layout, search, and site chrome.
- `public/` — assets plus generated artifacts (`.md` mirrors, `llms*.txt`, sitemap, `_pagefind/`). Regenerate them with `npm run generate`; never edit them by hand.

## Before opening a PR

Run the same gate CI runs:

```sh
npm run ci          # full: lint, content checks, build, artifact checks, e2e
npm run ci:source   # faster: source-only checks for content edits
```

MDX conventions (enforced by `npm run lint:content`): use `> **Note:**` instead of `> [!NOTE]`, `{/* ... */}` instead of `<!-- -->`, escape dollar amounts as `\$`, and keep content images as markdown `![]()`.

PRs are validated by `.github/workflows/ci.yml`; merges to `main` deploy automatically to GitHub Pages.
