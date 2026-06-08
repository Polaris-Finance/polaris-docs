# Polaris Docs Council Review: Top 33 Must + Top 33 Could

Audit date: 2026-06-08

Scope: the `polaris-docs` repository, all 50 MDX content pages, generated docs artifacts, local exported site behavior, Pagefind search, link integrity, mobile/accessibility behavior, SEO/indexability, LLM/bot crawlability, and product-context checks against the public testnet app at `https://app.testnet.polarisfinance.io/` plus the local Polaris app/protocol repository at `/home/ahirice/Documents/git/polaris`.

## Council

Six specialized reviewers contributed independent findings, each with at least 33 ideas:

1. Information architecture, search, and SEO.
2. UX copy, clarity, and terminology.
3. Mobile, responsive behavior, accessibility, and reader experience.
4. Performance, build artifacts, crawlability, and LLM/bot ingestion.
5. Link integrity, routes, static assets, and QA automation.
6. Product accuracy, DeFi mechanics, app-flow coverage, and competitive completeness.

The integrated review also ran local checks, production build checks, Playwright tests, a rendered-route crawl, and Lighthouse summaries.

## Verified Evidence

- `npm run lint:content`: passed, 67 source files scanned.
- `npm run check:links`: passed, 482 local links checked.
- `npm run check:links:external`: passed, 482 links plus 6 external links checked.
- `npm run build`: passed, 52 static pages generated, Pagefind indexed 50 pages and 2,490 words.
- `npm run check:pagefind`: passed.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npm run test:e2e`: 6 passed, 2 intentionally skipped by viewport.
- Local Lighthouse on the docs homepage: performance 100, SEO 100, best practices 96, accessibility 92.
- Local rendered-route crawl found one concrete mobile overflow: `/stewardship/flows` overflowed by 69px, driven by wide math/table content.
- Local Lighthouse found docs issues: unnamed copy-page options button, small touch targets, an unsized `polaris-system-v2.svg` image, and render-blocking CSS estimate.
- `npm run check:artifact` failed against the current `out/` snapshot because exported HTML and `out/sitemap.xml` contain stale `/polaris-docs` / `tokenbrice.github.io` references while the default source config says `https://docs.polarisfinance.io`.
- Multiple reviewers verified live deployment drift: `docs.polarisfinance.io` was NXDOMAIN during review, while `public/CNAME`, sitemap, robots, and metadata advertise it as canonical.
- Multiple reviewers verified live project-site drift: `https://tokenbrice.github.io/polaris-docs/` served HTML, but root-scoped assets and routes 404 in that deployment mode.
- Product-context reviewers verified live app terms/routes not covered well by docs: Dashboard, Swap, Borrow, Earn, Split, Zap, Guide, Advanced, Analytics, fpETH, vpETH, Floor Carry, WETH faucet, POLAR Staking.
- Several pages still say the app URL is unpublished/forthcoming while `content/launch-status.mdx` links the public testnet app.

## Voting Method

The council grouped duplicates, then weighted findings by:

- Cross-reviewer recurrence.
- Verified defect vs speculative improvement.
- User safety and transaction-risk impact.
- Crawlability/indexability impact.
- Search and onboarding impact.
- Implementation leverage.

Vote labels below are approximate consensus strength: `6/6` means every lens supported the theme directly or through a duplicate; `5/6` means near-consensus; lower counts still made the list because the item is concrete and implementation-ready.

## Top 33 Must Ideas

These are the release, trust, crawlability, and task-completion fixes the council would prioritize first.

| # | Votes | Area | Must idea | First implementation move |
|---:|---:|---|---|---|
| 1 | 6/6 | Hosting, SEO, deploy | Choose one canonical docs host and make `public/CNAME`, `SITE_URL`, `BASE_PATH`, workflow env, sitemap, robots, `llms*.txt`, canonical tags, OG URLs, and README agree. | Decide between `docs.polarisfinance.io` root hosting and `tokenbrice.github.io/polaris-docs`; update `app/site-config.mjs`, `public/CNAME`, `.github/workflows/deploy.yml`, README, and regenerate public artifacts. |
| 2 | 6/6 | DNS, indexability | Fix `docs.polarisfinance.io` DNS or stop advertising it until it resolves. | If custom domain is intended, add/fix DNS and GitHub Pages custom-domain validation; otherwise remove `public/CNAME` and set `SITE_URL=https://tokenbrice.github.io`, `BASE_PATH=/polaris-docs`. |
| 3 | 6/6 | Build artifacts | Clean and rebuild `out/` under the chosen host/base-path mode so exported HTML, assets, sitemap, and robots are internally consistent. | Add a prebuild cleanup or artifact build step that removes stale `out/`; run `npm run build` with the same env that `check:artifact` uses. |
| 4 | 6/6 | QA automation | Add a post-build and post-deploy smoke check for HTML asset paths, canonical URLs, robots, sitemap, `llms.txt`, status codes, and MIME types. | Create `scripts/check-live-artifact.mjs` or extend `check-export-artifact.mjs` to fetch deployed pages and verify `_next` JS/CSS, SVG/PNG assets, robots, sitemap, and canonical host. |
| 5 | 6/6 | Launch status copy | Fix the app-URL contradiction across Launch Status, Getting Started, FAQ, Risk Disclosure, and Safety. | Replace "official app URL not published" with "public testnet app is live on Sepolia; production app and mainnet contracts are not live/published." |
| 6 | 6/6 | Navigation, onboarding | Add a prominent "Open Testnet App" link/callout with Sepolia-only warning. | Add a top-nav link and repeat the CTA on `/launch-status` and `/getting-started`; keep production/mainnet caveats adjacent to the CTA. |
| 7 | 6/6 | Safety, IA | Promote Safety and Verification from a path into a top-level gate. | Move or duplicate `content/paths/safety-verification.mdx` into a top-level route and place it before action guides in `content/_meta.js`. |
| 8 | 6/6 | Testnet onboarding | Create a Testnet 2 source-of-truth page/table. | Add `/resources/testnet` or expand `/launch-status` with app URL, Sepolia chain ID `11155111`, current phase, production status, faucet/WETH guidance, testnet limitations, and manifest links. |
| 9 | 5/6 | Contracts, verification | Make Testnet 2 contracts discoverable without implying production canonicity. | Add a clearly labeled Sepolia section to `content/resources/contracts.mdx` or link exact local/public deployment manifests; mark addresses as replaceable testnet artifacts. |
| 10 | 5/6 | Parameters, product accuracy | Publish current testnet parameters where users need them. | Add pUSD/pGOLD testnet values such as MCR, Emergency/Recovery thresholds, redemption fee floor, and curve constants where verified from manifests; separate testnet values from pending production values. |
| 11 | 6/6 | App IA coverage | Add a "Using the App" docs section matching live app labels. | Add pages or a route map for Dashboard, Swap, Borrow, Earn, Split, Zap, Guide, Advanced, and Analytics so users can search by UI labels. |
| 12 | 6/6 | Glossary, search | Add glossary/search coverage for live app vocabulary. | Define fpETH, vpETH, Split, Zap, Floor Carry, Reserve Loan, WETH, sepETH, SP, PSM, Advanced, Guide, APR, and POLAR Staking in `content/resources/glossary.mdx`. |
| 13 | 6/6 | pETH docs | Document Split, fpETH, and vpETH. | Add `/peth/split` or a Using App page explaining pETH -> fpETH + vpETH, merge behavior, floor leg, volatility leg, risk, and current app route. |
| 14 | 5/6 | Yield/app flows | Document Zap flows. | Add a Zap guide covering WETH -> pUSD/pGOLD purchase -> Stability Pool deposit, approvals, simulation, slippage, and first-loss risk. |
| 15 | 5/6 | Borrow/app flows | Reconcile "trove", "CDP", "Borrow", "loan", pETH, and fpETH terminology. | Add a mapping box to borrower pages: docs call the position a trove; app/contracts may say CDP/Borrow; reserve loans may be against fpETH if that is the live mechanic. |
| 16 | 5/6 | Getting started | Explain WETH vs ETH vs Sepolia test assets in the testnet flow. | Update `content/getting-started.mdx` with WETH faucet behavior, Sepolia network setup, token value caveat, and the first Swap/Borrow/Earn path. |
| 17 | 5/6 | Search UX | Improve Pagefind ranking and synonyms for app/action terms. | Add boosted text or search metadata so `app`, `testnet`, `official app`, `zap`, `fpETH`, `vpETH`, `borrow`, `earn`, `swap`, and `WETH faucet` return the intended pages. |
| 18 | 5/6 | Risk language | Soften absolute floor/guarantee claims and scope them to contract/liveness assumptions. | Replace phrases like "never fall", "can only ever rise", "guaranteed liquidity", and "risk-free" with invariant-scoped wording plus gas, slippage, MEV, smart-contract, and chain-liveness caveats. |
| 19 | 5/6 | App/docs consistency | Align risk and governance/stewardship language with live app copy. | Replace or qualify app/doc references to "risk-free round trip" and "governance split"; use "stewardship" and residual-risk framing consistently. |
| 20 | 5/6 | POLAR docs | Clarify current POLAR Staking vs forthcoming vePOLAR locking. | Update `content/polar/*`, `content/stewardship/vepolar.mdx`, and conversion paths with current testnet staking status, pending vePOLAR status, and production caveats. |
| 21 | 4/6 | Tokenomics consistency | Resolve POLAR supply/distribution contradictions. | Reconcile the 100,000,000 genesis allocation claim, "supply/distribution pending", and any "Polar Council 8.2%" statements as fixed, draft, illustrative, or pending. |
| 22 | 5/6 | pAsset catalog | Mark pUSD/pGOLD as Testnet-active and pCHF/pBigMac as illustrative/future if accurate. | Update `content/minting/passet-catalog.mdx` and related pages so serious user flows center on the assets actually exposed in Testnet 2. |
| 23 | 5/6 | Transaction pages | Add "before you sign" checklists to action guides. | For minting, trove management, Stability Pool, Zap, Swap, Split, redemptions, and conversion: show network, app URL, contract/address, amount, fee, slippage, quote freshness, and approval checks. |
| 24 | 5/6 | Accessibility | Fix table accessibility: captions/labels, non-empty headers, and keyboard-focusable overflow wrappers. | Add an MDX table wrapper or CSS/JS enhancement; replace blank first-column headers in redemptions, stewardship, pETH bonding curve, and POLAR token tables with visible or sr-only labels. |
| 25 | 5/6 | Mobile | Increase mobile touch targets to at least 44px for docs controls. | Override Nextra hamburger, search, header links, sidebar links, copy/options buttons, and previous/next controls in `app/globals.css`. |
| 26 | 4/6 | Mobile | Fix `/stewardship/flows` mobile overflow. | Wrap the wide math expression, provide a smaller formula layout, and stack or horizontally manage the adjacent Flow table. |
| 27 | 5/6 | Testing | Expand Playwright coverage to all 50 generated routes. | Add tests for route load, no network 404s, no horizontal overflow, metadata/canonical presence, axe after hydration, touch target size, table focusability, and search result quality. |
| 28 | 5/6 | LLM crawlability | Improve generated `llms.txt` / `llms-full.txt` quality and coverage. | Extend `scripts/generate-llms.mjs` to strip noisy JSX/style/class content, preserve useful alt/table text, add app vocabulary, and optionally generate `llms-index.json`. |
| 29 | 5/6 | Link checking | Extend link checks to generated LLM files and JSX component props. | Scan `public/llms*.txt`, `BlogPostCard url=`, `BlogPostCard image=`, and any future app CTA props; include status and MIME checks for assets. |
| 30 | 4/6 | Structured data | Add richer JSON-LD and search metadata once host drift is fixed. | Add `Organization`, `WebSite`, `BreadcrumbList`, and richer `TechArticle`; emit `SearchAction` only after a crawlable search URL exists. |
| 31 | 4/6 | Freshness signals | Add "last verified" or `updated` metadata to volatile pages. | Use frontmatter or a component for Launch Status, Contracts, Audits/Security, Testnet, FAQ, and action pages; wire it into sitemap/JSON-LD. |
| 32 | 4/6 | App crawlability dependency | Fix testnet app bot/static behavior because docs link to it. | In the app repo, serve real `robots.txt`/`sitemap.xml` or explicit noindex policy, return real 404s for unknown bot/static paths, and add meta description/canonical/OG tags. |
| 33 | 4/6 | Performance dependency | Improve testnet app asset caching and JS loading because docs send users there. | Add immutable cache headers for hashed app `/assets/*`, split/lazy-load wallet/provider/protocol modules, and add production header/perf checks. |

## Top 33 Could Ideas

These should follow the must-list or be batched with nearby implementation work.

| # | Votes | Area | Could idea | First implementation move |
|---:|---:|---|---|---|
| 1 | 5/6 | Section hubs | Expand thin hub pages into useful landing pages. | Add task summaries, "start here if" routing, child-page summaries, and status callouts to `/minting`, `/peth`, `/yield`, `/polar`, `/resources`, and similar hubs. |
| 2 | 4/6 | Internal linking | Add body-copy links for link equity and reader routing. | Do not rely only on sidebar links; add contextual links from home, core concepts, getting started, and hubs into deeper task pages. |
| 3 | 4/6 | Route discoverability | Add route aliases or redirects matching app labels. | Consider `/borrow`, `/earn`, `/swap`, `/zap`, `/guide`, `/split`, and `/advanced` aliases once base-path behavior is stable. |
| 4 | 4/6 | UI mapping | Add "where this appears in the app" boxes. | Place small UI-location callouts on Swap, Borrow, Earn, Split, Zap, trove, Stability Pool, POLAR, and verification pages. |
| 5 | 4/6 | Screenshots | Add current Alpha screenshots or route-level UI anchors where stable. | Start with Getting Started, Open Trove/Borrow, Stability Pool/Earn, Swap, Zap, Split, faucet/Get WETH, and app navigation. |
| 6 | 4/6 | FAQ | Convert FAQ bold Q/A paragraphs into headings or details/summary sections. | This improves scanability, anchorability, FAQPage JSON-LD extraction, and mobile reading. |
| 7 | 4/6 | Glossary UX | Add alphabet jump navigation and app-term grouping to the glossary. | Add A-Z anchors plus a "Live app terms" subsection. |
| 8 | 4/6 | Diagrams | Add visible captions and short key takeaways to complex figures. | Add `figcaption` to `SystemOverviewFigure` and short summaries below infographics such as lineage, flywheel, and bonding curve. |
| 9 | 4/6 | Timeline a11y | Make `LaunchTimeline` semantic on mobile. | Render an ordered list fallback or duplicate semantic content instead of relying only on a `role="img"` timeline label. |
| 10 | 3/6 | Readability | Tighten prose measure from 80ch to about 70-72ch. | Adjust `article :is(p, li)` in `app/globals.css` after checking tables/figures remain wide enough. |
| 11 | 4/6 | Mobile tables | Add stacked mobile alternatives for the widest tables. | Prioritize launch status, redemptions, stewardship lifecycle, yield sources, and parameter/status tables. |
| 12 | 3/6 | Mobile affordance | Add visible horizontal-scroll affordances for wide tables/code blocks. | Add gradient edge/focus affordances and labels so readers know content scrolls sideways. |
| 13 | 3/6 | Motion | Extend reduced-motion coverage to hover transforms/transitions. | Review `.pl-depth-card`, blog cards, and hover transforms in `app/globals.css`. |
| 14 | 3/6 | Landmarks | Add labels for breadcrumb, prev/next, page toolbar, and footer regions. | Reduce axe `region` warnings from Nextra wrappers where possible. |
| 15 | 3/6 | Contrast QA | Run axe/contrast checks in both dark and light themes. | Add Playwright theme loops for sampled pages and later all routes. |
| 16 | 3/6 | Developer docs | Mark example code in `content/paths/develop.mdx` as pseudo-code or make it copy-safe. | Add a note above undefined helpers and split the long block into smaller mobile-friendly examples. |
| 17 | 4/6 | External links | Normalize Polaris blog URLs and enforce component-prop link checks. | Add trailing slashes if they avoid redirects; scan BlogPostCard `url` and `image` props in CI. |
| 18 | 4/6 | Duplicate anchors | Add duplicate heading-slug linting. | Verified duplicates exist in `content/yield/deposit-to-stability-pool.mdx` for `enter-an-amount` and `confirm`; teach checks Nextra suffix behavior. |
| 19 | 4/6 | Navigation integrity | Automate `_meta.js`, orphan page, sitemap, LLM, and exported HTML coverage checks. | Compare `content/**/*.mdx`, `_meta.js`, sitemap URLs, Pagefind page count, and generated `llms.txt`. |
| 20 | 4/6 | Host consistency | Add a dedicated host consistency checker. | Compare `public/CNAME`, `SITE_URL`, `BASE_PATH`, README deploy text, workflow env, sitemap, robots, `llms*.txt`, and exported canonicals. |
| 21 | 3/6 | Sitemap tuning | Use page-role-specific sitemap priority/changefreq. | Give Launch Status, Testnet, Contracts, and Safety higher freshness; make evergreen explainers lower churn. |
| 22 | 3/6 | LLM artifacts | Split `llms-full.txt` into section-level files and/or Markdown exports. | Generate `/llms-index.json`, `/llms-sections/*.txt`, or plain Markdown per page for selective LLM ingestion. |
| 23 | 3/6 | Search snippets | Add Pagefind fragment quality checks. | Verify snippets exclude sidebar/nav boilerplate and repeated disclaimers; boost actionable sections. |
| 24 | 3/6 | Prefetch/perf | Reduce noisy Nextra/Next route prefetching on dense pages. | Investigate Nextra/Next prefetch options; reviewers saw many internal route fetches on glossary. |
| 25 | 3/6 | Bundle/perf | Audit global Nextra features, fonts, and LaTeX loading. | Disable global `latex` where possible, trim Cormorant weights, and consider system serif fallback if metrics justify it. |
| 26 | 3/6 | Client patches | Make `A11yEnhancements` and `SearchPanelFix` less fragile. | Prefer static/CSS solutions or tighter targeted observers; add regression tests around internal Nextra DOM assumptions. |
| 31 | 2/6 | Print/PDF | Add print/PDF styling checks for wide tables and SVG diagrams. | Useful for auditors, integrators, and internal review packets. 
| 32 | 2/6 | Brand/color a11y | Improve color tables with swatches plus text/hex values and contrast guidance. | Avoid color-only interpretation in `content/resources/brand-assets.mdx`.

## Deliberation Notes

- The council did not find broken internal content links in the source docs; the stronger link problems are deployment-host drift and live asset/canonical drift.
- The docs content is unusually complete conceptually, but it lags the live Testnet app vocabulary and routes. That is why app-label coverage outranked many prose-polish items.
- Performance of the local docs homepage is strong by Lighthouse. The more urgent performance/crawlability risks are deployment consistency, the unresolved canonical host, table/mobile defects, and the linked testnet app's bot/static/performance behavior.
- Several recommendations touch `/home/ahirice/Documents/git/polaris` because the docs send users to the testnet app. They are included as docs launch dependencies, not as edits made in this repo.
- Existing local modifications in `.github/workflows/deploy.yml`, README, `app/layout.jsx`, `app/not-found.jsx`, and `scripts/check-export-artifact.mjs` were observed during review and left intact.

## Suggested Implementation Order

1. Fix host/base-path/DNS/deploy consistency and add artifact/live smoke checks.
2. Fix testnet app URL/status copy and add the Open Testnet App path.
3. Add Testnet 2 source-of-truth content: official sources, addresses/manifests, parameters, WETH/faucet, production caveats.
4. Add Using the App coverage for live routes and app terms, starting with Split/fpETH/vpETH and Zap.
5. Harden safety/risk language and add before-you-sign checklists.
6. Fix mobile/a11y defects: tables, touch targets, `/stewardship/flows`, image dimensions, all-route tests.
7. Improve search/LLM/structured-data once canonical URLs and app vocabulary are stable.
