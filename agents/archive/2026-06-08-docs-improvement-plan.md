# Polaris Docs Improvement Plan

Audit date: 2026-06-08  
Scope: content quality, information architecture, design and usability, accessibility, performance, SEO and discoverability, code health, deployment health.

## Audit Basis

- Reviewed all `content/**/*.mdx`, `_meta.js` navigation files, custom components, CSS, app metadata, build scripts, and GitHub workflows.
- Ran `npm run lint:content`, `npm run check:links`, `npm run build`, `npm run check:pagefind`, and `npm audit --omit=dev --audit-level=high`; all passed locally.
- Built static export successfully: 40 content pages, 42 HTML files, Pagefind indexed 40 pages and 2,468 words.
- Served `out/` locally at `http://localhost:4173` and inspected desktop/mobile rendering with Playwright snapshots and screenshots.
- Chrome DevTools MCP was not configured. `@axe-core/cli` could not run because its ChromeDriver expected Chrome 146 while the local browser was Chrome 145, so accessibility findings are from source review and Playwright accessibility snapshots.

## Executive Summary

The docs are already structurally healthy: MDX frontmatter is present, local links and anchors pass, search works, sitemap/robots/LLM artifacts are generated, Pagefind smoke tests exist, and the prose is unusually complete for a pre-launch protocol. The most valuable improvements are not basic cleanup. They are about removing user-risk ambiguity, making the current launch state impossible to misread, improving topic-cluster discoverability, and hardening the custom Nextra layer.

The highest-risk issue is the mismatch between "current public Public Testnet 1" messaging and action pages that tell users to verify Ethereum mainnet, chain ID 1, and mainnet contracts. The highest technical issue is that the deploy workflow builds with `BASE_PATH=/polaris-docs` even though the repo is configured for the custom root domain `docs.polarisfinance.io`.

## Ranked Roadmap

Impact: 5 = user trust, safety, deployability, or acquisition-critical.  
Effort: XS, S, M, L.  
ROI is a pragmatic priority call, not a formula.

| Rank | Idea | Dimensions | Impact | Effort | ROI | Main Evidence |
|---:|---|---|---:|---|---|---|
| 1 | Create a single Launch Status and Network Truth page, then make every action page point to it | Content, IA, safety, SEO | 5 | M | Very high | `content/index.mdx` says Public Testnet 1 is current; `content/getting-started.mdx` and paths require Ethereum mainnet; `content/resources/contracts.mdx` says Sepolia Public Testnet 1 exists but addresses are not canonical |
| 2 | Fix the GitHub Pages base-path/custom-domain deployment mismatch | Code health, SEO, performance | 5 | S | Very high | `.github/workflows/deploy.yml` sets `BASE_PATH=/polaris-docs`; `public/CNAME`, `README.md`, sitemap, robots, and `next.config.mjs` target root custom domain |
| 3 | Run a protocol terminology and status consistency sweep | Content clarity, risk, legal/compliance posture | 5 | M | Very high | Contradictions around `pAsset` vs pETH, POLAR emissions vs "no emissions", PSM naming, "deployed contracts" vs pending artifacts, and absolute guarantees |
| 4 | Promote safety from a path into a top-level gate | Design, IA, usefulness | 4 | S | Very high | Safety is mandatory in the prose but buried under `Choose Your Path`, after several journeys |
| 5 | Add crawlable section hub pages for each major docs cluster | SEO, IA, usability | 4 | M | High | `/minting`, `/peth`, `/yield`, `/polar`, `/stewardship`, `/resources`, and `/explainers` have sidebar groups but no exported hub pages |
| 6 | Make page titles and H1s entity-rich | SEO, clarity | 4 | S | High | Titles like `Bonding Curve`, `Floor Price`, `FAQ`, `Develop`, `Flows`, and `vePOLAR` lack Polaris/pETH context in search snippets |
| 7 | Convert key task pages into decision-ready guides | Content usefulness, design | 4 | M | High | Guides are clear but often conceptual because parameters, contract addresses, and app labels are pending |
| 8 | Add structured data and stronger social metadata | SEO, discoverability | 4 | S-M | High | No JSON-LD currently; page-level Open Graph metadata drops `siteName`, image dimensions, and image alt |
| 9 | Clean `llms-full.txt` and search corpus generation | AI discoverability, search, code health | 4 | M | High | Generated `llms-full.txt` includes raw `<style>`, JSX, `className`, and component props from MDX |
| 10 | Fix generated artifact determinism and freshness checks | Code health, SEO | 3 | S | High | `sitemap.xml` uses filesystem `mtime`; tracked generated files can be stale or dirty after local builds |
| 11 | Add browser-based regression tests for Nextra patches | Code health, accessibility, design | 3 | M | Medium-high | `SearchPanelFix`, `A11yEnhancements`, and CSS selectors depend on internal Nextra class names/DOM |
| 12 | Extract homepage custom UI out of MDX into components/CSS | Code health, performance, maintainability | 3 | M | Medium-high | `content/index.mdx` embeds large style blocks and bespoke layout logic |
| 13 | Reduce hydrated JS and font overhead where Nextra allows | Performance | 3 | M-L | Medium | Homepage loads about 720 KB raw JS, about 228 KB gzip/190 KB Brotli; font preload warnings appear |
| 14 | Add linting/formatting/type guardrails for JS, JSX, CSS, and MDX | Code health, accessibility | 3 | S-M | Medium | CI validates content and links but has no ESLint, jsx-a11y, hooks lint, Prettier, or JS type checking |
| 15 | Improve local and Pagefind search quality | UX, AI/search | 3 | S-M | Medium | Search works, but snippets are dense and table text is flattened (`DestinationWhat they receiveStatus`) |
| 16 | Neutralize persuasive or adversarial copy inside docs | Content tone, trust | 2 | S-M | Medium | Some stewardship/governance comparisons read like positioning rather than neutral documentation |
| 17 | Move external link checks out of blocking deploy path | Code health, release reliability | 2 | S | Medium | External checks pass now but can fail deploys because third-party sites are transient |
| 18 | Remove or repoint `npm run start` | Code health | 2 | XS | High | `next start` is invalid for `output: 'export'`; `npm run serve` is the correct preview path |

## Detailed Recommendations

### 1. Launch Status and Network Truth

Create a top-level `/launch-status` or `/safety-verification` page that answers, in one screen:

- Current phase: public Public Testnet 1 on Sepolia, mainnet forthcoming.
- Current network(s): Sepolia chain ID `11155111` for testnet, Ethereum mainnet chain ID `1` for future production.
- Official app URL status.
- Canonical contract address status.
- Audit and bug bounty status.
- Which docs are conceptual, testnet-actionable, or mainnet-actionable.
- Last verified date and source of truth.

Then change every task page to include a small status callout that says either:

- "Testnet-actionable now: use Sepolia artifacts from the protocol repo."
- "Mainnet-actionable later: do not connect or sign until this page links the official app and addresses."
- "Conceptual only."

This addresses the biggest safety and trust issue: users should never need to reconcile `Public Testnet 1 NOW` with `Ethereum mainnet chain ID 1` instructions on their own.

Suggested files:

- `content/index.mdx`
- `content/getting-started.mdx`
- `content/resources/safety-verification.mdx`
- `content/resources/contracts.mdx`
- all task pages under `content/minting`, `content/yield`, and `content/polar`

### 2. Deployment Base Path

Fix `.github/workflows/deploy.yml` so the deployed artifact matches the intended custom root domain.

Current risk:

- `public/CNAME` pins `docs.polarisfinance.io`.
- `robots.txt`, `sitemap.xml`, and metadata canonical URLs point to `https://docs.polarisfinance.io`.
- Deploy sets `BASE_PATH=/polaris-docs`, which makes static asset URLs and internal paths expect a subdirectory.

Recommended implementation:

- Remove `BASE_PATH: /polaris-docs` from the production custom-domain deploy.
- Centralize `SITE_URL` and `BASE_PATH` in a shared config used by sitemap, robots, metadata, and Next config.
- Add a post-build smoke check that greps `out/index.html` for wrong asset prefixes and validates that `out/sitemap.xml` locs match the deploy host.
- Keep a separate optional workflow or env preset for project-page deployments.

This is a release blocker because a successful CI run can still upload an artifact with wrong URLs.

### 3. Terminology and Status Consistency Sweep

Do a docs-wide pass with an explicit glossary of allowed status terms:

- `designed`
- `implemented in prototype`
- `testnet deployed`
- `audited`
- `mainnet deployed`
- `live`

High-value fixes:

- Replace "enforced by deployed contracts" where addresses/audits are pending with "designed to be enforced by immutable contracts at audited deployment."
- Reconcile the `10-min` page's "POLAR emissions are planned" sentence with tokenomics/Flows pages that say "no emissions."
- Define `pAsset` as the CDP-minted synthetic debt asset class. Define pETH separately as the bonding-curve collateral token. If pETH remains in a table, rename the table to "Polaris assets."
- Clarify the PSM naming conflict: Polaris rejects external-collateral/custodial peg modules, while any internal `PegStabilityModule` contract is a pETH mint/redeem path.
- Replace summary-level "guaranteed liquidity", "instant withdrawal", and "not volatile" phrasing with language scoped to contract assumptions, gas/liveness, and ETH-denominated floor mechanics.

Add a content lint rule for the most dangerous phrases once the canonical language is chosen.

### 4. Safety as a Top-Level Gate

The current IA puts "Safety and Verification" under `Choose Your Path`, but the docs repeatedly tell users to verify before interacting. Promote it.

Options:

- Rename `content/resources/safety-verification.mdx` to a top-level `content/safety-verification.mdx`.
- Or add a top-level `content/launch-status.mdx` and keep the path page as a journey-specific version.
- Put this before `Getting Started` in `content/_meta.js`.
- Add a short homepage banner/card linking to it.

The goal is not more warnings. It is an unmissable source of truth for "can I safely do this today?"

### 5. Section Hub Pages

Add `index.mdx` pages for major directories:

- `/paths`
- `/explainers`
- `/minting`
- `/peth`
- `/yield`
- `/redemptions-liquidations`
- `/polar`
- `/stewardship`
- `/resources`

Each hub should have:

- One-sentence purpose.
- "Start here if..." routing.
- Links to child pages with 1-line summaries.
- Current launch/actionability status.
- Related risks and prerequisites.

Benefits:

- Better topic clusters for crawlers.
- Better internal link graph than sidebar-only discovery.
- Easier onboarding for users who land from search.
- More natural places for safety/status banners and related content.

### 6. Entity-Rich Titles and H1s

Search result snippets need the entity in the title. Recommended examples:

- `Bonding Curve` -> `pETH Bonding Curve`
- `Floor Price` -> `pETH Floor Price`
- `FAQ` -> `Polaris Finance FAQ`
- `Develop` -> `Develop on Polaris`
- `Flows` -> `Polaris Flows`
- `vePOLAR` -> `vePOLAR Locking and Stewardship`
- `Stability Pool` -> `Polaris Stability Pool`
- `Redemptions` -> `pAsset Redemptions`

Keep sidebar labels concise through `_meta.js`; frontmatter titles can be more search-friendly.

### 7. Decision-Ready Task Pages

The task pages are useful but still often read as conceptual pre-launch scripts. Add compact decision tools:

- "Before you sign" checklist.
- "Parameters this action depends on" table.
- "Can this be done today?" status.
- "What can go wrong" box linked to the relevant Risk Disclosure section.
- "What the app should show" fields without inventing final labels.
- Worked examples for borrower net cost, redemption impact, Stability Pool P&L, and conversion quote slippage.

Highest-priority pages:

- `content/minting/open-a-trove.mdx`
- `content/minting/managing-your-trove.mdx`
- `content/yield/deposit-to-stability-pool.mdx`
- `content/redemptions-liquidations/redemptions.mdx`
- `legacy conversion how-to page`

For `redemptions.mdx`, consolidate repeated "all troves, pro-rata, no ICR queue" warnings into one prominent borrower-impact section plus one worked example.

### 8. Structured Data and Social Metadata

Add JSON-LD:

- `WebSite` with `SearchAction`.
- `Organization`.
- `BreadcrumbList` per page.
- `TechArticle` or `Article` for docs pages.
- `FAQPage` for the FAQ page once questions are represented structurally.

Improve metadata:

- Preserve `openGraph.siteName` in page-level metadata.
- Use structured `images` objects with `url`, `width`, `height`, and `alt`.
- Consider per-section OG images later; not needed for the first pass.
- Add `publishedTime`/`modifiedTime` only when dates are deterministic.

### 9. Clean LLM and Search Exports

`llms-full.txt` should be content, not implementation. Today it includes raw MDX style blocks and JSX from the homepage.

Recommended changes:

- Parse MDX with an AST instead of raw string slicing.
- Strip `import`, `export`, `<style>`, JSX-only layout, `className`, inline CSS, and component props.
- Keep image alt text, headings, paragraphs, list text, and table text.
- Convert custom cards to plain links with title/description.
- Add `explainers` to `sectionTitles` so `llms.txt` does not produce lowercase `## explainers`.
- Add a CI check that fails if `public/llms-full.txt` contains `<style`, `className=`, `import `, or large raw JSX blocks.

Also review Pagefind output:

- Give core pages and task guides higher search weight if Nextra/Pagefind supports it.
- Consider excluding dense changelog sections from default search ranking.
- Make table-heavy pages produce readable snippets.

### 10. Generated Artifact Determinism

Current generated outputs are tracked and regenerated before build:

- `public/sitemap.xml`
- `public/robots.txt`
- `public/llms.txt`
- `public/llms-full.txt`

Problems:

- `generate-sitemap.mjs` uses filesystem `mtime`, which can reflect checkout or build behavior rather than meaningful content updates.
- CI can pass even if committed generated files are stale unless the build output is compared.
- Local builds can dirty the tree.

Options:

- Stop tracking generated files and create them only in CI/build.
- Or keep tracking them and add `npm run generate && git diff --exit-code public/sitemap.xml public/robots.txt public/llms*.txt`.
- Use Git last-commit date per MDX file, explicit `updated` frontmatter, or omit `<lastmod>`.
- Centralize `SITE_URL` so sitemap, robots, metadata, and LLM URLs cannot drift.

### 11. Browser Regression Tests

The repo has strong static validation but no rendered-browser guardrails. Add focused Playwright tests:

- Desktop and mobile homepage render without horizontal document overflow.
- Mobile menu opens, traps focus while open, and is not focusable while closed.
- Search opens, returns results for `trove`, and search result panel aligns to the input.
- Theme switch works.
- Copy-page dropdown has an accessible name.
- Keyboard tab order reaches header, search, menu, content, and footer predictably.
- Basic axe pass once the local browser/driver mismatch is resolved.

These tests protect the custom patches:

- `components/SearchPanelFix.jsx`
- `components/A11yEnhancements.jsx`
- selector overrides in `app/globals.css`

### 12. Extract Homepage UI from MDX

The homepage is the most visually distinctive page, but `content/index.mdx` embeds substantial CSS and custom markup.

Recommended extraction:

- Move launch timeline into `components/LaunchTimeline.jsx` plus CSS module or global scoped CSS.
- Move timed explainer cards into a small component.
- Keep `index.mdx` mostly content and component calls.
- Ensure the component exports a clean text fallback for LLM/Pagefind generation.

Benefits:

- Easier maintainability.
- Cleaner `llms-full.txt`.
- Lower risk of MDX syntax breakage.
- Easier isolated visual testing.

### 13. Performance Pass

Current local export observations:

- Homepage HTML: about 201 KB raw, about 30 KB gzip and 20 KB Brotli.
- Largest content page HTML: about 220 KB raw.
- Homepage loaded JS chunks: about 720 KB raw, about 228 KB gzip and 190 KB Brotli.
- Two font preload warnings appeared in Chrome console.
- Search assets are not loaded until search interaction, which is good.

Recommended work:

- Check whether both Inter and Cormorant weights are necessary across all pages.
- Trim Cormorant weights if possible; four weights are currently requested.
- Investigate the unused font preload warnings and remove/prevent preloads for non-critical weights.
- Keep SVG infographics compressed and consider SVGO in CI.
- Consider whether Nextra features that load shared chunks can be disabled or deferred.
- Ensure GitHub Pages or the chosen CDN serves Brotli/gzip and long cache headers for `_next/static`.
- Avoid adding analytics or wallet scripts to docs unless they are deferred and privacy-safe.

This is not urgent because local rendering is fast and static export is cacheable, but mobile users and wallet-browser users will benefit.

### 14. Linting, Formatting, and Type Guardrails

Add low-friction tooling:

- ESLint flat config for React, React hooks, jsx-a11y, and Next.
- Prettier for JS, CSS, Markdown, and MDX.
- `// @ts-check` or `jsconfig.json` for the small JS surface.
- CSS lint for accidental global selector sprawl if the CSS continues to grow.

Keep existing content-specific checks; they are valuable. Extend `check-content.mjs` with Polaris-specific terms once canonical language is locked.

### 15. Search UX Improvements

Search works, but results can be dense. Improvements:

- Add synonyms/aliases in content for important terms: CDP/trove, reserve ratio/TCR, pETH/floor, conversion/POLAR mint.
- Improve excerpts around task pages with concise opening summaries.
- Consider dedicated glossary anchors for every key term and link them consistently.
- Exclude raw implementation details from indexed content after homepage extraction.

### 16. Tone and Persuasion

The docs generally have a strong voice, but some pages shift from documentation to competitive argument. Keep docs neutral and move sharper positioning to blog content.

Targets:

- Governance comparisons in `content/stewardship/stewardship.mdx`.
- Absolute or slogan-like claims in conceptual summaries.
- Repeated "No T-bills. No CEXs. No compromises." in places where users need operational clarity.

Docs should earn trust by being precise, not by sounding maximally confident.

### 17. CI Reliability

Current CI runs external link checks on PRs and deploys. This is useful but brittle.

Recommended:

- Keep internal route, anchor, and public asset checks blocking.
- Move external link checks to scheduled CI, or make them non-blocking in deploy with retries and clear reporting.
- Preserve manual `check:links:external` for release readiness.

### 18. `npm run start`

`next start` is not appropriate for `output: 'export'`.

Recommended:

- Remove `start`, or alias it to `npm run serve`.
- Update README if needed so all preview instructions use `npm run serve` after build.

## Findings by Dimension

### Content

Strong:

- Broad coverage: 40 pages across onboarding, minting, pETH, yield, redemptions/liquidations, POLAR, stewardship, and resources.
- Good risk posture in long-form pages.
- Good use of examples and cross-links.
- Content checks catch common MDX and protocol-language gotchas.

Needs work:

- Launch state is ambiguous across testnet/mainnet pages.
- Some status and guarantee language is too absolute for pre-launch docs.
- Definitions of pAsset/pETH blur in several summaries.
- POLAR emissions/no-emissions language conflicts.
- Historical developer-doc notes are out of scope for the current app-surface execution.
- Some concepts appear without enough context: PolarEX, Reserve Loans, effective borrower net cost.
- Several pages repeat critical warnings rather than structuring them once at the decision point.

### Design and Usability

Strong:

- Nextra gives predictable docs navigation, table of contents, search, copy-page actions, and responsive layout.
- Brand styling is distinctive without breaking the docs surface.
- Mobile homepage has no document-level horizontal overflow in the tested viewport.
- Tables are intentionally scrollable on mobile.
- Search is prominent on desktop and mobile.

Needs work:

- Safety is not visually or navigationally prominent enough.
- Homepage custom UI is embedded in MDX and hard to reuse/test.
- Some mobile decorative elements have minor internal overflow.
- Closed mobile nav appears in accessibility snapshots; verify and fix focus/accessibility exposure if needed.
- Task pages would benefit from consistent status banners and decision checklists.

### Accessibility

Strong:

- Skip link exists.
- Landmarks are present.
- Search has an accessible combobox label.
- Copy-page options button is patched with an accessible name.
- Reduced-motion media query is present for custom homepage animation.

Needs work:

- Add automated axe/browser checks once the local ChromeDriver mismatch is resolved.
- Verify closed mobile nav is not focusable or announced unexpectedly by screen readers.
- Test keyboard order for desktop and mobile nav/search flows.
- Continue watching custom Nextra patches after dependency upgrades.

### Performance

Strong:

- Static export is fast and cacheable.
- Search assets are not loaded until search is used.
- SVG infographics are modest after compression.
- Pagefind indexing is tiny and fast.

Needs work:

- Hydrated JS is large for static docs.
- Fonts produce preload warnings and may include more weights than necessary.
- Homepage inline style blocks increase HTML and machine-readable output noise.
- Add bundle/asset budget checks only after deciding target budgets.

### SEO and Discoverability

Strong:

- Canonicals are generated.
- Sitemap and robots are present.
- Frontmatter descriptions are enforced at <=160 characters.
- Internal and external link checks pass.
- Pagefind indexes all 40 docs pages.
- `llms.txt` and `llms-full.txt` exist.

Needs work:

- Section hub pages are missing.
- Page titles need entity context.
- JSON-LD is absent.
- Page-level OG metadata can be richer.
- Sitemap `lastmod` should not depend on filesystem `mtime`.
- Generic Next/Nextra `.txt` payloads should be monitored in Search Console; block them only if they start indexing.

### Code Health

Strong:

- Small code surface.
- Static export constraints are documented in README.
- Build and Pagefind smoke tests are useful.
- Dependabot is configured.
- Production audit passes.

Needs work:

- Deploy workflow base path conflicts with custom-domain setup.
- Custom Nextra DOM patches are fragile without browser tests.
- No general lint/format/type guardrails.
- Generated artifacts need freshness/determinism policy.
- `npm run start` is misleading for static export.

## Suggested First Two Sprints

### Sprint 1: Safety and Deploy Correctness

1. Fix deploy base path and add artifact URL smoke check.
2. Add Launch Status/Network Truth page.
3. Promote safety/status in navigation.
4. Apply terminology/status sweep for the most dangerous contradictions.
5. Add content lint rules for the newly canonical terms.

Expected outcome: users cannot mistake testnet docs for mainnet instructions, and deploy artifacts match the production domain.

### Sprint 2: Discoverability and Maintainability

1. Add section hub pages.
2. Update entity-rich frontmatter titles/H1s.
3. Add JSON-LD and richer OG image metadata.
4. Clean `llms-full.txt` generation.
5. Extract homepage custom UI into components.
6. Add Playwright smoke tests for search/nav/mobile/accessibility basics.

Expected outcome: better organic discovery, cleaner AI/search exports, and lower risk from Nextra upgrades.

## Validation Checklist for Future Work

Run after each substantial docs change:

```bash
npm run lint:content
npm run check:links
npm run build
npm run check:pagefind
npm audit --omit=dev --audit-level=high
```

Add after implementing this plan:

```bash
npm run lint
npm run format:check
npm run test:e2e
npm run check:generated
```

For deploy-specific checks:

```bash
# Verify no custom-domain production build references /polaris-docs
rg "/polaris-docs" out

# Verify sitemap and canonical URLs share the same SITE_URL
rg "https://docs.polarisfinance.io" out/sitemap.xml out/index.html
```
