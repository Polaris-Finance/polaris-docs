# Polaris Docs Cleanup and Upgrade Plan

Date: June 8, 2026

This plan consolidates a broad local audit plus three read-only subagent audits:

- Content freshness and link audit
- Dead code, dead content, and orphaned asset audit
- Optimization, CI, and maintainability audit

No build, test, or validation command was run during this planning pass.

## Executive summary

The repository is in good shape structurally: all live MDX pages appear to be represented in `_meta.js`, the docs have strong validation scripts, and Node/npm/tooling constraints are documented. The main risks after today's consolidation are not broad rot, but a few high-impact inconsistencies left behind by page movement and launch-status updates.

The highest-priority work is:

| Priority | Area | Core issue | Recommended first action |
| --- | --- | --- | --- |
| P0 | Deploy/generated artifacts | Public/generated artifacts and live deploy can lag behind newly consolidated source routes. | Regenerate generated artifacts, redeploy, and add a source-route vs artifact-route parity gate. |
| P0 | LLM/search generation | `scripts/generate-llms.mjs` still contains old routes and "Testnet 2" wording. | Align generator route vocabulary with current `content/_meta.js` and app search vocabulary. |
| P0 | Parameter consistency | Several pages/components disagree on beta/MCR/current testnet values. | Make `content/resources/parameters.mdx` the single source of truth and rewrite conflicting examples. |
| P1 | Public testnet source data | A public docs page exposes a local filesystem path for artifact provenance. | Replace with public repo/commit/source references or state that artifacts are internal until published. |
| P1 | Search quality | Hidden search vocabulary is marked `data-pagefind-ignore="all"`, likely excluding intended boost terms. | Move boost terms into Pagefind-indexed content or supported metadata. |
| P1 | Dead code/assets | Several globally registered MDX components and screenshots appear unused after consolidation. | Delete or deliberately rewire them, then remove matching CSS. |
| P1 | CI/deploy time | Deploy can build up to three times through `npm run ci`, Playwright, and deploy artifact rebuild. | Split build and validation responsibilities so CI reuses the same `out/` artifact. |

## What is already working

| Area | Positive finding |
| --- | --- |
| Navigation | Bounded scans found no orphaned live MDX pages: every `content/**/*.mdx` route appeared to have a matching `_meta.js` entry. |
| Validation coverage | `package.json` already includes content linting, link checks, generated-artifact checks, host consistency, navigation integrity, Pagefind checks, e2e smoke tests, and production audit. |
| Compatibility docs | README documents the intentional `zod` override and `next build --webpack` constraint. |
| Versioning | Node/npm versions are aligned across `package.json`, `.nvmrc`, `.node-version`, and workflows. |
| Ignored generated state | `.next`, `out`, `public/_pagefind`, `.playwright-mcp`, `.impeccable`, and test result residue are ignored. |

## P0: Correctness and freshness issues

### 1. Regenerate and redeploy consolidated routes

Evidence:

- Current source nav includes routes such as `quickstart`, `troubleshooting`, `resources/parameters`, and `using-app/manage-trove` in `content/_meta.js`, `content/resources/_meta.js`, and `content/using-app/_meta.js`.
- Subagent live checks found `/quickstart`, `/resources/parameters`, `/troubleshooting`, and `/using-app/manage-trove` returning 404 on the live GitHub Pages site while `/launch-status` returned 200.
- Generated public artifacts such as `public/llms.txt`, `public/llms-index.json`, and `public/sitemap.xml` were reported as missing some newly consolidated pages.

Impact:

Users can follow current source links to pages that do not exist in the deployed site. Search engines, LLM consumers, and Pagefind can also index stale or incomplete route data.

Actions:

| Step | Work |
| --- | --- |
| 1 | Regenerate sitemap and LLM artifacts from current `content/`. |
| 2 | Deploy the current static export so live GitHub Pages matches source. |
| 3 | Add a route-parity check that compares `content/**/*.mdx` derived routes against generated sitemap, `llms.txt`, and exported `out/**/*.html`. |
| 4 | Make deploy fail if any current `_meta.js` route is absent from generated artifacts or exported HTML. |

Suggested ownership:

Treat this as the first fix because several other issues only become user-visible after deployment.

### 2. Replace stale LLM/search generator vocabulary

Evidence:

- `scripts/generate-llms.mjs` still hardcodes "Testnet 2" in the `LaunchTimeline` text replacement.
- The same generator still references removed/pre-consolidation routes such as `/getting-started`, `/paths`, `/paths/safety-verification`, `/paths/borrow-passets`, `/paths/earn-yield`, `/paths/hold-use-peth`, `/resources/glossary`, `/polar/participate-in-conversion`, and `/polar/polar-token`.
- `app/[[...mdxPath]]/page.jsx` has newer search vocabulary that references Public Testnet 1 and current routes, so the app and LLM generator are now diverging.

Impact:

Generated `llms*` files can tell external agents and search consumers that the current phase is "Testnet 2" while authored docs say "Public Testnet 1". Removed routes can also keep stale concepts discoverable.

Actions:

| Step | Work |
| --- | --- |
| 1 | Replace the hardcoded `LaunchTimeline` LLM text with the current `components/LaunchTimeline.jsx` wording: Public Testnet 1 on Sepolia, mainnet forthcoming. |
| 2 | Remove the dead `TimedExplainers` handler unless those pages are intentionally restored. |
| 3 | Replace stale `routeVocabulary` entries with the current vocabulary from `app/[[...mdxPath]]/page.jsx`. |
| 4 | Update `sectionTitles` and `sectionOrder` to match `content/_meta.js`: Introduction, Launch Status, Quickstart, Using the App, Troubleshooting, Understand Polaris, Resources, Changelog. |
| 5 | Regenerate public LLM artifacts and make `npm run check:generated` enforce freshness. |

Consolidation opportunity:

Move route vocabulary and section labels into one shared module consumed by both `scripts/generate-llms.mjs` and `app/[[...mdxPath]]/page.jsx`. This avoids two independently maintained route maps.

### 3. Fix parameter contradictions and stale "pending" language

Evidence:

- `content/peth/index.mdx` says beta will be around `0.3`.
- `content/resources/parameters.mdx` and `components/BondingCurveExplorer.jsx` use `0.15`.
- `content/minting/managing-your-trove.mdx` hardcodes a simulator MCR default of `1.5`, while the current parameter table reportedly lists MCR as `115%` and `150%` as Emergency Mode action MCR.
- Pages such as `content/minting/managing-your-trove.mdx`, `content/redemptions-liquidations/liquidations.mdx`, and `content/redemptions-liquidations/recovery-mode.mdx` still imply important thresholds are unavailable, while `content/resources/parameters.mdx` now publishes reviewed Public Testnet 1 values.

Impact:

These are user-actionable docs. Conflicting collateralization and curve parameters can cause readers to size positions incorrectly or mistrust the docs.

Actions:

| Step | Work |
| --- | --- |
| 1 | Declare `content/resources/parameters.mdx` the canonical owner for current numeric values in the page intro. |
| 2 | Update pETH concept pages to distinguish current Public Testnet 1 beta from any future production target. |
| 3 | Update simulator defaults or label them explicitly as illustrative if they intentionally do not match current testnet parameters. |
| 4 | Replace "pending/finalized closer to launch" with "production final pending; current Public Testnet 1 values live on Parameters" wherever testnet values now exist. |
| 5 | Add a content lint rule or small data table import so high-risk parameters are not duplicated as free text across pages. |

Preferred direction:

Keep numeric parameter tables on `content/resources/parameters.mdx`; other pages should link to that page and only repeat values when the value is essential to a worked example.

## P1: Public-facing trust and link issues

### 4. Remove local filesystem path from public testnet docs

Evidence:

- `content/resources/testnet.mdx` was reported to include `/home/ahirice/Documents/git/polaris` as an artifact source.

Impact:

The path is not actionable for external readers and leaks local development structure.

Actions:

| Step | Work |
| --- | --- |
| 1 | Replace the local path with a public repository URL and commit hash if artifacts are public. |
| 2 | If artifacts are not public, state that manifests are internal during Public Testnet 1 and list only public app/network details. |
| 3 | Add relative artifact paths only when paired with a public base URL. |

### 5. Improve contract-address provenance

Evidence:

- `content/resources/contracts.mdx` uses a broad "June 2026" freshness label while publishing high-risk Sepolia addresses.

Impact:

Readers need exact provenance for contract addresses. A month-level freshness label is too vague for a page that can influence wallet behavior.

Actions:

| Step | Work |
| --- | --- |
| 1 | Add exact review date, for example `Last verified: June 8, 2026`. |
| 2 | Add manifest commit/source for the address set. |
| 3 | Add Sepolia explorer links per address or per address section. |
| 4 | Add a content rule requiring exact dates on pages containing contract address tables. |

### 6. Resolve custom docs domain risk

Evidence:

- README correctly says `docs.polarisfinance.io` is not validated.
- External spot checks reported that `https://docs.polarisfinance.io/` resolves to an old GitBook-style Polaris docs site, not this repo.

Impact:

Users can land on stale docs through the most natural docs subdomain. This is a trust and phishing-surface issue.

Actions:

| Step | Work |
| --- | --- |
| 1 | Keep `https://tokenbrice.github.io/polaris-docs/` as canonical until DNS is reclaimed. |
| 2 | Coordinate with whoever owns `docs.polarisfinance.io` to redirect or replace the old site. |
| 3 | Do not add `public/CNAME` or set `BASE_PATH=""` until the custom domain serves this repo. |
| 4 | Add a recurring live smoke check that verifies the chosen canonical origin and flags stale alternate origins. |

### 7. Reconcile docs with the main Polaris site

Evidence from external spot checks:

- `https://polarisfinance.io/` is live and links to the testnet app.
- The main site's FAQ still describes the Sepolia testnet as "gated" and says users should DM Polaris for access.
- This docs repo now presents Public Testnet 1 as public and points readers to `https://app.testnet.polarisfinance.io/`.

Impact:

Even if the docs are correct, the main website can undercut them by presenting a different access model.

Actions:

| Step | Work |
| --- | --- |
| 1 | Decide which source owns launch/testnet status. |
| 2 | If this docs repo owns status, update the main site FAQ or link it to `/launch-status`. |
| 3 | If the main site owns status, revise docs wording to match gated/current access. |
| 4 | Add a cross-site checklist for launch-status changes: app URL, network, phase name, access model, analytics link, audit status. |

External pages spot-checked:

| URL | Observation |
| --- | --- |
| `https://polarisfinance.io/` | Live; public site describes roadmap and links to testnet app. |
| `https://app.testnet.polarisfinance.io/` | Live app URL resolves. |
| `https://polarisfinance.io/blog/` | Blog index is live and has current posts through April 27, 2026. |
| `https://polarisfinance.io/blog/bonding-curve/` | Linked blog post is live. |
| `https://polarisfinance.io/blog/polaris-mints-anything/` | Linked blog post is live. |
| `https://polarisfinance.io/blog/burn-pETH-mint-POLAR/` | Linked blog post is live. |
| `https://polarisfinance.io/blog/pusd-no-counterparty/` | Linked blog post is live. |
| `https://polarisfinance.io/blog/stewardship-not-governance/` | Linked blog post is live. |
| `https://polarisfinance.io/blog/pGOLD-finishing-what-digixdao-started/` | Linked blog post is live. |
| `https://polarisfinance.io/blog/why-polaris/` | Linked blog post is live. |
| `https://polarisfinance.io/blog/polaris-flows/` | Linked blog post is live. |
| `https://polarisfinance.io/blog/path-to-the-north-star/` | Latest blog link is live; note slug is `path-to-the-north-star`, not `the-path-to-the-north-star`. |
| `https://polarisfinance.io/blog/bull-case/` | Blog index link is live; note slug is `bull-case`. |

## P1: Dead code, dead content, and consolidation

### 8. Remove or intentionally reuse unused MDX components

Evidence:

The following registered MDX components had zero content usage in a bounded scan:

| Component | Current status |
| --- | --- |
| `AddressBlock` | Imported and registered, no MDX tag usage found. |
| `Breadcrumbs` | Imported and registered, no MDX tag usage found. |
| `DetailAccordion` | Imported and registered, no MDX tag usage found. |
| `ReadingTimeBadge` | Imported and registered, no MDX tag usage found. |
| `RiskChip` | Imported and registered, no MDX tag usage found. |
| `Stepper` | Imported and registered, no MDX tag usage found. |
| `StickyMobileCta` | Imported and registered, no MDX tag usage found. |

Impact:

Unused components and CSS make the docs harder to maintain and can increase global client/style surface.

Actions:

| Step | Work |
| --- | --- |
| 1 | Decide whether each component is intentionally reserved for near-term content. |
| 2 | Delete unused component files that are not reserved. |
| 3 | Remove their imports and registry entries from `mdx-components.js`. |
| 4 | Remove matching CSS blocks from `app/globals.css`. |
| 5 | If a component is useful, wire it into a specific current page instead of keeping it as invisible inventory. |

### 9. Clean up unused screenshots and public design sources

Evidence:

- `public/screenshots/borrow.jpg`, `dashboard.jpg`, `earn.jpg`, `split.jpg`, and `swap.jpg` were reported as unreferenced.
- Only `content/using-app/zap.mdx` was found referencing a screenshot.
- `public/og-image.svg` is public, but metadata points to `OG_IMAGE_PATH = '/og-image.png'` and no source/content references to the SVG were found.
- `public/screenshots/zap.png` is the largest author screenshot at about 442 KB.

Impact:

Public assets that are not referenced create stale surface area and can confuse future authors. Large screenshots also increase repository and artifact weight.

Actions:

| Step | Work |
| --- | --- |
| 1 | If screenshots are still accurate, place them into the matching `using-app/*` pages. |
| 2 | If screenshots are stale after consolidation, delete them. |
| 3 | Move `og-image.svg` to a non-public design/source location if it is only the source for `og-image.png`. |
| 4 | Compress `zap.png` or convert it to WebP/AVIF/JPEG if transparency is unnecessary. |

### 10. Archive stale historical agent reports

Evidence:

- `agents/page-consolidation-plan.md` reportedly says it is superseded and references removed alias/router layers.
- `agents/top-33.md` reportedly says counts are stale.
- `agents/docs-improvement-plan.md` reportedly references absent `content/getting-started.mdx`.

Impact:

The `agents/` directory can become a second stale docs layer. Future agents may treat old plans as current instructions.

Actions:

| Step | Work |
| --- | --- |
| 1 | Move superseded reports to `agents/archive/` with dates, or delete them if not useful. |
| 2 | Add a short `agents/README.md` explaining which plans are current. |
| 3 | Keep this cleanup plan as the current source until completed or superseded. |

## P1/P2: Optimization and maintainability

### 11. Remove duplicate builds from CI and deploy

Evidence:

- `package.json` runs `npm run build` inside `npm run ci`.
- `playwright.config.mjs` runs `npm run build && node scripts/serve-export.mjs` as its `webServer` command unless `PLAYWRIGHT_BASE_URL` is set.
- `.github/workflows/deploy.yml` runs `npm run ci`, then runs `npm run build` again for the Pages artifact.

Impact:

Deploy can build multiple times before upload. This slows feedback and increases the chance that validation and uploaded artifacts are not exactly the same build.

Actions:

| Step | Work |
| --- | --- |
| 1 | Split scripts into `build`, `validate:source`, `validate:generated`, `validate:artifact`, and `test:e2e:served` or equivalent. |
| 2 | Make CI build once, then run artifact checks and Playwright against that same `out/` directory. |
| 3 | In deploy, upload the already-validated `out/` artifact instead of rebuilding after `npm run ci`. |
| 4 | Keep an escape hatch for local Playwright runs that need to build automatically. |

Suggested target flow:

| Context | Flow |
| --- | --- |
| PR CI | install -> source checks -> build once -> artifact checks -> serve `out/` -> e2e |
| Deploy | install -> same validation flow -> upload same `out/` -> live smoke |
| Local e2e | if `out/` exists, serve it; otherwise build once unless `PLAYWRIGHT_BASE_URL` is set |

### 12. Make Pagefind search boosts actually index

Evidence:

- `SearchBoost` in `app/[[...mdxPath]]/page.jsx` renders hidden "Search vocabulary" terms.
- The node has `data-pagefind-ignore="all"`, which likely excludes the boost terms from Pagefind.

Impact:

The docs carry a manual search vocabulary, but the terms may never enter the index.

Actions:

| Step | Work |
| --- | --- |
| 1 | Confirm Pagefind behavior for hidden content and `data-pagefind-ignore`. |
| 2 | Remove the ignore attribute if the current approach is acceptable. |
| 3 | Prefer Pagefind-supported metadata or weighting if hidden text is not robust. |
| 4 | Add a targeted search smoke case for synonyms such as "official app", "WETH faucet", "split", and "conversion auction". |

### 13. Consolidate base-path link handling

Evidence:

- Internal base-path handling appears in `mdx-components.js`, `components/internal-links.jsx`, and `components/NextSteps.jsx`.

Impact:

Multiple helpers can diverge and create subtle GitHub Pages base-path bugs.

Actions:

| Step | Work |
| --- | --- |
| 1 | Add shared helpers in `app/site-config.mjs`, for example `isExternalHref`, `isHashHref`, and `hrefWithBase`. |
| 2 | Replace local implementations in MDX anchors, internal links, and next-step cards. |
| 3 | Keep local route checks in `scripts/check-links.mjs` aligned with the same rules. |

### 14. Reduce global CSS surface

Evidence:

- `app/globals.css` is large and contains theme overrides plus route/component-specific styles for timelines, charts, simulators, cards, and special widgets.
- It is imported globally from `app/layout.jsx`.

Impact:

Every route receives styles for components it may never render. This increases maintenance cost and makes component deletion harder.

Actions:

| Step | Work |
| --- | --- |
| 1 | Keep Nextra overrides, color tokens, typography, base prose, focus styles, and accessibility globals in `globals.css`. |
| 2 | Move component-specific styles into CSS modules or colocated component CSS where supported. |
| 3 | Delete CSS for removed unused components during the dead-code cleanup. |
| 4 | Revisit `.pl-chart { min-width: 700px; }` and provide a mobile-specific layout or responsive SVG behavior. |

### 15. Profile rare interactive MDX widgets

Evidence:

- `BondingCurveExplorer` and `TroveSimulator` are globally registered in `mdx-components.js`.
- They are used rarely, one occurrence each in content according to the bounded scan.

Impact:

Depending on Nextra/Next bundling, rare client widgets may increase chunk surface for pages that do not use them.

Actions:

| Step | Work |
| --- | --- |
| 1 | Inspect route chunks after a build when validation is allowed. |
| 2 | If rare widgets are included broadly, lazy-load them or import them only in the pages that use them. |
| 3 | If they are already route-split, leave the registry as-is. |

## P2: Content improvements and research-backed claims

### 16. Add sources or as-of dates for time-dependent competitive claims

Evidence:

- `content/why-polaris.mdx` includes claims such as LUSD spending roughly 20% of its life over 1% above peg.
- The same page labels BOLD/Liquity V2 as 2024, which may refer to testnet, code, or announcement rather than production launch.

Impact:

These are persuasive claims. Without citations or as-of dates, they become brittle and easier to challenge.

Actions:

| Step | Work |
| --- | --- |
| 1 | Add citations and exact "as of" dates where claims rely on market history or live competitor status. |
| 2 | Rephrase claims qualitatively where a precise number is not important. |
| 3 | Add a content rule or checklist for numbers tied to market share, dates, TVL, supply, price, or competitor status. |

### 17. Standardize freshness metadata

Evidence:

- Many status/action pages use `<PageStatusBanner lastUpdated="June 2026" />`.
- High-risk pages such as contracts and parameters should carry exact review dates.

Impact:

Month-only freshness is acceptable for conceptual pages but weak for addresses, parameters, app URLs, and launch status.

Actions:

| Step | Work |
| --- | --- |
| 1 | Define freshness tiers: exact date required, month acceptable, no date required. |
| 2 | Require exact dates for launch status, quickstart, contracts, parameters, testnet artifacts, safety verification, and troubleshooting. |
| 3 | Allow month-level review labels for FAQ and stable conceptual pages. |
| 4 | Teach `scripts/check-content.mjs` to enforce exact dates for high-risk pages. |

### 18. Keep blog "Go deeper" links current

Evidence:

- Existing Polaris blog links spot-checked during this pass resolved successfully.
- The blog index has newer posts not currently reflected everywhere in docs, including `path-to-the-north-star` and `bull-case`.

Impact:

The blog is a useful companion layer. Docs should link to the best matching essay, not just older available essays.

Actions:

| Step | Work |
| --- | --- |
| 1 | Keep current links that resolved successfully. |
| 2 | Review concept pages for opportunities to link to newer, more relevant posts. |
| 3 | Avoid generic `https://polarisfinance.io/blog/` "Go deeper" links when a specific post exists. |
| 4 | Keep trailing slash consistency because `scripts/check-links.mjs` already enforces it for Polaris blog URLs. |

## Suggested execution order

| Order | Work package | Why first |
| --- | --- | --- |
| 1 | Fix generator route vocabulary, regenerate artifacts, and redeploy. | Removes stale public route/search/LLM state. |
| 2 | Fix parameter contradictions and testnet/provenance pages. | Protects user-actionable correctness. |
| 3 | Add route/artifact parity and exact-date content checks. | Prevents the same class from recurring. |
| 4 | Clean unused components, screenshots, public SVG, and stale agent reports. | Reduces maintenance surface after correctness is stable. |
| 5 | Refactor CI/deploy to build once and serve the same artifact. | Speeds future iteration once correctness gates are clear. |
| 6 | Consolidate link helpers and route vocabulary modules. | Converts ad hoc fixes into shared infrastructure. |
| 7 | Profile widgets and CSS, then split only where measurable. | Avoids speculative optimization before obvious cleanup is done. |

## Validation checklist after implementation

Run only when ready to validate:

| Check | Purpose |
| --- | --- |
| `npm run lint:content` | Catch unresolved TODOs, frontmatter issues, and MDX gotchas. |
| `npm run check:links` | Verify internal routes, anchors, and public assets. |
| `npm run check:generated` | Confirm sitemap and LLM artifacts are current. |
| `npm run check:navigation` | Confirm `_meta.js` and route integrity. |
| `npm run check:pagefind` | Confirm search artifact health. |
| `npm run build` | Generate a fresh static export. |
| `npm run check:artifact` | Smoke-check exported GitHub Pages artifact. |
| `npm run test:e2e` | Browser smoke coverage for docs behavior. |
| `npm run check:links:external` | Networked external-link pass; keep non-blocking if external sites are flaky. |

## Open decisions

| Decision | Options | Recommendation |
| --- | --- | --- |
| Public testnet authority | Docs own status, main site links to docs; or main site owns status, docs mirror it. | Make `/launch-status` the canonical source and link the main site to it. |
| Unused MDX components | Delete now; archive; or wire into content. | Delete unless there is a concrete near-term page using the component. |
| Screenshots | Delete stale screenshots; or add them to task pages. | Use only if they match the current app UI; otherwise delete. |
| `og-image.svg` | Keep public; move to source asset folder; delete. | Move out of `public/` if it is only a PNG source. |
| CI architecture | One monolithic `ci`; or staged validation scripts. | Stage scripts so the same `out/` artifact is built once and validated everywhere. |

## Notes for future agents

- Do not treat older files in `agents/` as current unless they explicitly say they are active.
- Prefer `content/resources/parameters.mdx`, `content/resources/contracts.mdx`, and `content/launch-status.mdx` as owners for parameters, addresses, and launch state.
- Do not change the documented `zod` override or `next build --webpack` behavior without a targeted compatibility test.
- Do not switch from GitHub Pages project path to a root/custom domain until `docs.polarisfinance.io` is confirmed to serve this repo.
