# Polaris Docs SEO Upgrade Plan

Date: June 9, 2026

**Status — June 9, 2026:** All **P0** and **P2** items are implemented and verified (full production build + 9 static checks + 98 e2e tests all pass). **P1 is deferred by request** (intentional). Boxes below reflect completion.

This plan consolidates a six-member read-only SEO review council plus a direct verification pass against the built `out/` artifact. Council dimensions:

- Metadata & social cards (title, description, Open Graph, Twitter/X cards, favicons, locale)
- Structured data (JSON-LD: Organization, WebSite, BreadcrumbList, TechArticle, FAQPage)
- Crawlability & indexation (robots, sitemap, canonical, hosting/domain, 404, trailing slash, orphans)
- Content & on-page SEO (headings, alt text, internal linking, keyword/intent targeting)
- Technical SEO & Core Web Vitals (SSG render, fonts, images/CLS, preloads, LCP/INP)
- AI/LLM discoverability & entity SEO (llms.txt ecosystem, entity disambiguation, answer-engine extractability)

Every load-bearing claim below was re-verified against source and `out/`. No build, deploy, or content edit was made during this pass.

## Executive summary

The SEO foundation here is **unusually mature** — self-referencing canonicals, full JSON-LD graph (Organization → WebSite → per-page TechArticle + BreadcrumbList), generated sitemap with per-route `lastmod`, generated robots, a curated `llms.txt` ecosystem, theme-color, a complete icon set, and per-page frontmatter title/description on all 42 pages. Heading hierarchy, image alt text, anchor-text quality, and SSG render completeness are all clean. This plan is therefore about **closing a small number of real gaps**, not rebuilding.

Two council premises were corrected during verification (see [Verified corrections](#verified-corrections-do-not-action)): the 404 already ships `noindex`, and the `out/*.txt` files are React Server Component payloads, not markdown mirrors.

Highest-leverage work, weighted by impact against effort:

| Priority | Area | Core issue | First action | I / E |
| --- | --- | --- | --- | --- |
| P0 | Structured data | `FAQPage` schema is **dead code** — the extractor never matches `faq.mdx`'s `###` question format, so zero FAQ schema ships. | Add an H3 branch to `extractFaqJsonLd` and assert FAQPage in the build. | H / L |
| P0 | Metadata / social | `using-app/*` pages have one-word frontmatter titles → social cards read bare "Swap"/"Zap"/"Earn" with no brand, and `<title>` is thin. | Give the 5 pages descriptive frontmatter titles (fixes H1, `<title>`, og:title at once). | H / L |
| P0 | Entity / AEO | `Organization` has no `sameAs`, no `alternateName`; "Polaris" is a name-collision risk and docs sit on a non-Polaris domain. | Add `alternateName`/`knowsAbout`/`polarisfinance.io` now; add social `sameAs` once URLs are supplied. | H / L |
| P0 | AI discoverability | `llms.txt` is curated but **undiscoverable** — not linked from any HTML and not at origin root. | Add `<link rel="alternate" type="text/markdown">` in `<Head>` + a footer link. | H / L |
| P0 | Core Web Vitals | Homepage hero SVG renders as a raw, unsized `<img>` → CLS on the top page + a wasted below-fold preload that hurts LCP. | Add `width/height` + `loading="lazy"` (or route through Nextra `Image`). | M / L |
| P1 | Crawl / domain | **Strategic:** canonical home is `tokenbrice.github.io/polaris-docs` (personal account, shared host, deep subpath). | Migrate to `docs.polarisfinance.io` (repo already supports `BASE_PATH=""`). | H / M |
| P1 | Metadata | Home `<title>` double-brands ("Polaris … Documentation — Polaris Docs") and `SITE_TITLE` disagrees with frontmatter. | Reconcile the home title + `SITE_TITLE` constant. | M / L |
| P1 | AEO / freshness | `lastVerified`/`updated` are `null` for all 42 pages; the date lives in a `PageStatusBanner` prop the parser never reads. | Parse `lastUpdated="…"` in `generate-llms.mjs` + `seo.mjs`. | M / L |
| P1 | Content | `/why-polaris` (highest-intent newcomer page) has only **1** inbound body link; "Liquity V2" never appears in any title/description. | Add 1–2 contextual links + the lineage term to its description. | M / L |

## Impact × effort map

```
        LOW EFFORT                         HIGHER EFFORT
  H  ┌────────────────────────────┬────────────────────────────┐
  I  │ DO FIRST (P0)              │ STRATEGIC (P1)             │
  M  │ • FAQPage extractor       │ • Custom domain migration  │
  P  │ • using-app titles        │   (fixes 3 findings)        │
  A  │ • Org sameAs/alternateName│                            │
  C  │ • llms.txt head/footer link│                           │
  T  │ • homepage hero CLS/preload│                           │
     ├────────────────────────────┼────────────────────────────┤
  L  │ QUICK WINS (P1)           │ DEFERRED (P2)              │
  O  │ • home title/SITE_TITLE   │ • Home JSON-LD→WebPage      │
  W  │ • freshness prop parsing  │ • per-page .md mirrors      │
  -  │ • why-polaris links/kw    │ • datePublished + og dates  │
  M  │ • twitter:site/creator*   │                            │
  E  │ • AI-crawler robots       │ POLISH (P2, batch):        │
  D  │ • trailing-slash monitor  │ logo→raster · trbl desc ·  │
     │                            │ BlogPostCard dims · og png │
     │                            │ · llms-full HTML · TechArt │
     └────────────────────────────┴────────────────────────────┘
        * owner-blocked on confirmed social handles
```

## What is already strong (do not redo)

| Area | Positive finding |
| --- | --- |
| Canonical / metadataBase | Every page emits a correct self-referencing absolute canonical with basePath; no subpage falls back to the home URL. |
| JSON-LD graph | Organization → WebSite → per-page TechArticle + BreadcrumbList with sound `@id` references; no dangling refs; breadcrumb intermediates all resolve to real index pages. `SearchAction` correctly suppressed (client-side Pagefind). |
| Sitemap | 42/42 routes, per-route `lastmod`, no asset/junk URLs, CI freshness gate. (`priority`/`changefreq` are ignored by Google but harmless — keep.) |
| Per-page metadata | All 42 pages carry unique title + description (41/42 between 60–160 chars); OG image absolute and correctly dimensioned (1200×630, alt set); Twitter `summary_large_image`. |
| Headings & alt text | Exactly one H1 per page, no skipped levels; infographic alt text is keyword-dense and also feeds Pagefind. Zero generic anchors ("click here") sitewide. |
| SSG render | Full article body, headings, and links render in static HTML with no JS — crawlers index everything. MDX images carry `width/height/loading=lazy/decoding=async` + hashed immutable URLs. |
| Fonts / head | 2 woff2 preloaded with `display:swap`; all head scripts `async` (zero render-blocking JS); valid non-zoom-blocking viewport; no duplicate IDs. |
| llms.txt | Spec-conformant, curated (H1 + blockquote summary + sectioned `[title](url): desc`), absolute URLs; `llms-full.txt` guarded against `<style>`/`className`/`<svg>` leakage. |

---

## P0 — High impact, low effort (do first)

### 1. FAQ schema is dead — `extractFaqJsonLd` never matches `faq.mdx`

- [x] Add an H3 question branch to the FAQ extractor and assert FAQPage ships. **Done** — `app/seo.mjs` H3 parser; `check-export-artifact.mjs` asserts FAQPage; 15 questions now ship on `/resources/faq`.

**Evidence:** `content/resources/faq.mdx` writes every question as a Markdown H3 (`### What is Polaris?`, lines 14, 18, 22, …). `extractFaqJsonLd` (`app/seo.mjs:308`) only handles object literals (`question:`/`answer:`, regex at `:312`) and bold-line questions (`/^\*\*([^*?]+\?)\*\*$/`, `:360`). Neither matches, so it returns `null`. Verified: `grep -rl FAQPage out/` → **no matches anywhere**. The page emits only a generic TechArticle.

**Why:** This is the single highest-ROI structured-data item — the feature is fully built but emits nothing. FAQ content is broadly used by search and answer engines as `mainEntity` context, and the FAQ page already renders questions as visible H3 prose (no JS-hidden accordion), so it will not trip Google's "content must be visible" rule.

**Action:** Add a branch parsing `^###\s+(.+\?)\s*$` as the question, with the answer being the following lines until the next `###`/`##`/`---`. Then add a build assertion that `out/resources/faq.html` contains `"@type":"FAQPage"` (mirrors the existing generated-artifact gates).

`Impact: H · Effort: L · Confidence: H`

### 2. `using-app/*` titles produce brand-less social cards and thin SERP titles

- [x] Give the five `using-app/*` pages descriptive frontmatter titles. **Done** — e.g. og:title now "Swap in the Polaris App" (in-page `# H1` left untouched).

**Evidence:** `content/using-app/{earn,swap,zap,borrow,advanced}.mdx` have 1-word titles. The `%s — Polaris Docs` template applies only to `<title>`, not to OG/Twitter — `buildPageMetadata` sets `openGraph.title`/`twitter.title` to the raw frontmatter title (`app/seo.mjs:191`). Verified in `out/using-app/swap.html`: `<title>Swap — Polaris Docs</title>` but `<meta property="og:title" content="Swap"/>`.

**Why:** When pasted in X/Discord/Telegram, the card headline is literally "Swap" or "Zap" with no protocol context — kills recognizability and CTR. The thin `<title>` also wastes the strongest on-page ranking signal ("Earn" alone won't rank or attract clicks). One frontmatter edit per page fixes the H1, `<title>`, and og:title together.

**Action (frontmatter only):** e.g. `Earn in the Polaris App`, `Swap in the Polaris App`, `Zap into a Position`, `Borrow in the Polaris App`, `Advanced App Tools`. Keep them descriptive but tight.

`Impact: H · Effort: L · Confidence: H`

### 3. Entity disambiguation — add `sameAs`, `alternateName`, `knowsAbout` to Organization

- [x] Enrich the Organization node now with the non-blocked fields; add social `sameAs` once URLs are confirmed. **Done** — `alternateName`, `knowsAbout`, and `sameAs: [polarisfinance.io]` added; social URLs still owner-blocked (see below).

**Evidence:** The Organization node (`app/seo.mjs:236`) carries only `name`, `description`, `url`, `logo` — no `sameAs`, `alternateName`, or `knowsAbout`. A repo-wide grep for social URLs (x/twitter/discord/github/telegram/medium/warpcast) returns **none**; the only external Polaris URL anywhere is `https://polarisfinance.io`.

**Why:** "Polaris" collides with other crypto projects. `sameAs` is the primary signal answer engines and the Knowledge Graph use to reconcile and verify an entity — its absence makes this site a weak candidate to be cited as *the* official Polaris Finance, and easier for a phishing clone to impersonate in AI answers. This directly undercuts the protocol's anti-phishing goal.

**Action:** Add now (no blockers): `alternateName: 'Polaris'`, `knowsAbout: ['pETH','pAssets','pUSD','POLAR','CDP stablecoin','bonding curve']`, and `sameAs: ['https://polarisfinance.io']`. Add the remaining `sameAs` entries (X, GitHub org, Discord/Telegram, CoinGecko/DefiLlama) once the owner confirms them — **do not invent handles.** See [Owner-blocked inputs](#owner-blocked-inputs).

`Impact: H · Effort: L · Confidence: H`

### 4. Make `llms.txt` discoverable (head + footer link)

- [x] Add a `<link rel="alternate" type="text/markdown">` for `llms.txt` (and `llms-full.txt`) and a visible footer link. **Done** — via `alternates.types` in `seo.mjs` + `layout.jsx`, plus a "Docs for LLMs (llms.txt)" footer link.

**Evidence:** The artifacts ship at `/polaris-docs/llms.txt` (basePath, `app/site-config.mjs:2`), not the conventional origin root, and are referenced from **no HTML** — no head `<link>` (`app/layout.jsx:155`), no footer link (`:136`), only a one-line changelog mention. `grep llms` across `app/`, `components/`, `content/` confirms.

**Why:** `llms.txt` has no autodiscovery beyond "try `/llms.txt`". On a project-page host you cannot place a file at the user's github.io root, so the only path for a model to reach it is an explicit crawlable link. With zero references, all the generation effort yields almost no AEO benefit.

**Action:** Add `<link rel="alternate" type="text/markdown" href={pathWithBase('/llms.txt')} title="llms.txt">` (and `llms-full.txt`) to the `<Head>` in `app/layout.jsx`, plus a small footer link. The custom-domain migration (P1) would additionally let `llms.txt` live at the true origin root.

`Impact: H · Effort: L · Confidence: H`

### 5. Homepage hero `<img>` — fix CLS, wasted preload, and cache path in one change

- [x] Add `width={1200} height={540} loading="lazy"` to `SystemOverviewFigure` (or route it through Nextra `Image`). **Done** — dims + `loading="lazy"`/`decoding="async"` added; the wasted homepage preload is now gone (verified absent in `out/index.html`).

**Evidence:** `components/SystemOverviewFigure.jsx:5` emits a raw `<img>` with no `width`/`height`/`loading`. The source SVG has `viewBox="0 0 1200 540"` but no intrinsic dimensions, and `app/globals.css:623` sets `width:100%;height:auto` with no `aspect-ratio` — so the browser cannot reserve space until the 25KB SVG parses. Verified: `out/index.html` ships `<img src="/polaris-docs/polaris-system-v2.svg" alt="…">` with nothing else, and Next auto-emits a `preload as=image` for it (homepage only). The *same* SVG on `core-concepts.html` (MDX → Nextra `Image`) correctly gets `width="1200" height="540" loading="lazy" decoding="async"` + a hashed URL.

**Why:** CLS is a Core Web Vitals ranking signal and this is the highest-traffic page. The image sits below the launch timeline and H1 (below the fold), so the auto-preload is also wasted high-priority bandwidth competing with the real LCP. Adding `loading="lazy"` both reserves layout space (with explicit dimensions) and makes Next stop emitting the harmful preload. Routing through Nextra `Image` additionally moves it onto the hashed, immutably-cached `_next/static/media` path.

`Impact: M · Effort: L · Confidence: H`

---

## P1 — Strategic and quick follow-ups

### 6. Strategic: migrate off the `tokenbrice.github.io/polaris-docs` subpath

- [ ] Stand up `docs.polarisfinance.io`, add a `CNAME`, and flip the deploy/CI env to `BASE_PATH=""`.

**Evidence:** Canonical home is `https://tokenbrice.github.io/polaris-docs` — a personal GitHub account, on the shared `github.io` apex, under a deep project subpath. Baked into `app/site-config.mjs:1-2` and hardcoded in workflows (`.github/workflows/deploy.yml:23-26,62-65`, `ci.yml:16-19`). No `CNAME` exists anywhere.

**Why (ranked SEO cost):** (1) no brand domain — all external links and shares accrue authority to a contributor's personal handle, not a Polaris-owned domain, and none transfers to `polarisfinance.io`; for an anti-phishing-sensitive protocol this is also a trust signal problem; (2) `github.io` is a heavily-abused shared host carrying host-level skepticism; (3) a 2–3 segment deep subpath weakens sitelink/breadcrumb presentation; (4) personal-account ownership is a bus-factor risk for a production property. This single move also resolves the `llms.txt` root-path problem (#4) and the entity domain-split (#3).

**Action:** Add `public/CNAME` (`docs.polarisfinance.io`) so it ships into `out/`; flip the four env vars in both workflows to `SITE_URL=https://docs.polarisfinance.io` and `BASE_PATH=""`. `normalizeBasePath('')` → `''` and `pathWithBase('/')` → `'/'` regenerate canonical, sitemap, OG, and JSON-LD URLs root-relative automatically — **no code change**. Keep the old `tokenbrice.github.io/polaris-docs` deploy alive with a client-side redirect (GitHub Pages can't issue 301s) and submit the new property in Search Console (Change-of-Address if the old one was verified).

`Impact: H · Effort: M · Confidence: H`

### 7. Reconcile the homepage `<title>` (double-brand + constant mismatch)

- [ ] Fix the home frontmatter title and align `SITE_TITLE`.

**Evidence:** `content/index.mdx:2` is `title: Polaris Finance Documentation`; with the template, `out/index.html` renders `<title>Polaris Finance Documentation — Polaris Docs</title>` ("Polaris" twice, "Documentation"/"Docs" twice). Separately, `SITE_TITLE` (`app/site-config.mjs:28`) is `'Polaris Documentation'` — a third wording used as the metadata default.

**Why:** Repeated brand tokens in the most important `<title>` dilute the SERP headline and invite Google to rewrite it. The constant/frontmatter mismatch means the fallback title silently differs from what ships.

**Action:** Set the home frontmatter to `title: Polaris Finance` (→ `Polaris Finance — Polaris Docs`) or use a title `absolute` object to drop the suffix; reconcile `SITE_TITLE` to the chosen wording.

`Impact: M · Effort: L · Confidence: H`

### 8. Freshness signals are `null` everywhere — parse the `PageStatusBanner` date

- [ ] Read `lastUpdated="…"` from `PageStatusBanner` in `generate-llms.mjs` and `seo.mjs`.

**Evidence:** `public/llms-index.json` has `"lastVerified": null` for **all 42** pages, yet nearly every page renders `<PageStatusBanner lastUpdated="June 8, 2026" />` (`components/PageStatusBanner.jsx:3`). The generator's `extractPageDate` looks for frontmatter keys or a `**Last verified:** <date>` body string (`scripts/generate-llms.mjs:~285`); the rendered banner reads `Last verified June 8, 2026` (no colon/bold) and the date lives in a JSX prop stripped before parsing. The same date logic backs `TechArticle.dateModified` (`app/seo.mjs:127`), which currently falls back to the git commit timestamp — so mechanical artifact-regen commits inflate the "modified" date, and `datePublished` is never emitted at all.

**Why:** Recency is a strong ranking/trust signal, especially for fast-moving DeFi status ("is Polaris on mainnet yet?"). The data exists on every page but is invisible to machines.

**Action:** Add one regex over raw MDX to read the `lastUpdated` prop, feeding both `llms-index.json` (`updated`/`lastVerified`) and `TechArticle.dateModified`. Pair with #15 (`datePublished`).

`Impact: M · Effort: L · Confidence: H`

### 9. `/why-polaris` is under-linked + missing the "Liquity" intent keyword

- [ ] Add 1–2 contextual body links to `/why-polaris`; add the lineage term to its description.

**Evidence:** `/why-polaris` has exactly **1** inbound body link sitewide (`content/resources/risk-disclosure.mdx:88`) vs 16–17 for `/peth` and `/minting`. Separately, "Liquity V2"/"BOLD" appear only in `why-polaris` body/alt text (`content/why-polaris.mdx:43+`); the word "fork" appears nowhere in `content/`, and the title/H1/description never mention the lineage.

**Why:** "Why Polaris" targets the highest-intent newcomer/evaluator queries (the trilemma, counterparty-free thesis); being a body-link orphan suppresses its crawl priority and ranking. "Liquity fork / Liquity V2" is a high-relevance discovery query for informed DeFi users with no titled landing target today.

**Action:** Add contextual links from `core-concepts.mdx`, `minting/index.mdx`, and/or `index.mdx` (anchor only, no new prose). Extend the `why-polaris` description to end with the lineage, e.g. "…rooted in the counterparty-free Liquity V2 / BOLD CDP lineage." Respects the deliberate "lineage" framing; avoids "fork" if the owner prefers.

`Impact: M · Effort: L · Confidence: M`

### 10. Add `twitter:site` / `twitter:creator` (owner-blocked on handle)

- [ ] Once the official X handle is confirmed, wire it into both metadata blocks.

**Evidence:** Neither tag ships (absent across all `out/*.html`). No handle exists anywhere in the repo.

**Why:** Attributes the card to the official account, enables analytics, and adds a follow affordance — but only with the *correct* handle; a guessed handle is worse than none.

**Action:** Add `TWITTER_HANDLE` to `site-config.mjs` and set `twitter.site`/`twitter.creator` in `app/layout.jsx:73` and `app/seo.mjs:200`. Bundle with #3 as one "social identity" change. See [Owner-blocked inputs](#owner-blocked-inputs).

`Impact: M · Effort: L · Confidence: H`

### 11. Declare an explicit AI-crawler posture in `robots.txt`

- [ ] Decide and encode allow/deny for answer-engine and training crawlers in the robots generator.

**Evidence:** `robots.txt` is generated (not static) at `scripts/generate-sitemap.mjs:187` as a bare `User-agent: * / Allow: / / Sitemap: …`. No explicit posture for `GPTBot`, `ClaudeBot`/`anthropic-ai`, `PerplexityBot`, `OAI-SearchBot`, `Google-Extended`, `CCBot`.

**Why:** The wildcard already allows them, so this is optimization, not a fix — but for an entity that *wants* to be cited, being explicit signals intent and lets you distinguish answer/search bots (allow) from training crawlers (a deliberate choice), and is a natural place to advertise `llms.txt`.

**Action:** Edit the `robots` template in `generate-sitemap.mjs:187` to add explicit `Allow` blocks for the answer/search UAs you want indexing. Do **not** block `/_next/` or `/_pagefind/` (Google needs JS/CSS to render).

`Impact: L–M · Effort: L · Confidence: M`

### 12. Trailing-slash 404 trap on the 8 section index routes

- [ ] Monitor Search Console for 404s on slashed section URLs; escalate to `trailingSlash: true` only if observed.

**Evidence:** `trailingSlash` is unset (defaults `false`), so Next exports flat files: `out/minting.html` plus an `out/minting/` directory with **no** `index.html`. Non-slash URLs (`…/minting`, matching canonical + sitemap) work; a slashed `…/minting/` resolves to the empty directory and is served as a 404. Leaf pages are unaffected (no same-named dir). Internal nav uses non-slash links, so this won't split indexing — it's a soft-404 risk on inbound *external* slashed links to the high-authority section hubs.

**Why:** Section hubs are the highest-authority non-home pages; a 404 on their slashed variant wastes inbound equity and is invisible until someone links with a slash.

**Action:** Prefer monitoring (low effort). Only if slashed section 404s appear, set `trailingSlash: true` in `next.config.mjs` and update `pathWithBase`/sitemap to emit slashed canonicals to match (larger, riskier — every canonical/OG/sitemap URL changes).

`Impact: M · Effort: L (monitor) / M (fix) · Confidence: H`

---

## P1 — Medium effort

### 13. Homepage JSON-LD should be `WebPage`/`CollectionPage`, not `TechArticle`

- [ ] Branch `buildPageJsonLd` on `path === '/'` to emit a hub type.

**Evidence:** `/` emits `TechArticle` with `headline: "Polaris Finance Documentation"` (`app/seo.mjs:391` always calls `buildTechArticleJsonLd`). The homepage is a docs landing/hub (launch timeline, system diagram, section links), not an article; `headline` duplicates the site title rather than describing article content.

**Why:** `TechArticle` implies a single authored how-to. A `CollectionPage`/`WebPage` (with `hasPart`/`about` referencing the section hubs) models the site structure accurately. Low penalty risk — this is a correctness/quality improvement.

`Impact: M · Effort: M · Confidence: M`

### 14. Emit a clean per-route markdown mirror (the `out/*.txt` are not it)

- [ ] Decide: make `llms-sections/*` discoverable (cheap) **or** emit per-route `.md` + link via `rel="alternate"`.

**Evidence:** The per-page `out/*.txt` files are RSC flight payloads (`"$Sreact.fragment" / I[7121,[],""] / HL[…woff2…]`), not readable markdown — verified by inspecting `out/core-concepts.txt`. They are not linked and not in the sitemap (harmless, but useless to a model). The only clean per-page content lives inside `llms-full.txt` and `llms-sections/*.txt`.

**Why:** Answer engines often prefer fetching one clean markdown doc behind a cited URL. There is currently no clean, predictable per-URL markdown path.

**Action:** Either rely on `llms-sections/` and make them discoverable (resolved largely by #4), or have `generate-llms.mjs` write each sanitized page `body` (already computed) to `public/<route>.md` and add `<link rel="alternate" type="text/markdown">` per page. Pick one canonical clean-markdown path; don't ship two.

`Impact: M · Effort: M · Confidence: H`

### 15. Add `datePublished` + Open Graph `article:*` dates

- [ ] Populate a stable `datePublished` per page and surface `og:locale` + `article:modified_time`.

**Evidence:** No `datePublished` is emitted anywhere (`grep '"datePublished"' out/*.html` → empty); only `dateModified` renders. `og:locale` and `article:published_time`/`modified_time` are absent even though the date is computed for JSON-LD.

**Why:** Article/TechArticle recommend both dates; `og:locale` defaults to `en_US` (benign) and `article:modified_time` is a near-free freshness reinforcement once #8 lands. Effort is Medium because `generateMetadata` currently receives only `metadata`, not `sourceCode`/dates — the date has to be threaded in.

`Impact: L–M · Effort: M · Confidence: H`

---

## P2 — Low-impact polish (batch in one pass)

- [x] **Org logo → raster.** `Organization.logo` points at `emblem.svg` (`app/seo.mjs:243`); Google's logo guidance favors raster. Point it at the existing square `favicon.png` (192×192) or `apple-touch-icon.png`. `L / L`
- [x] **Expand `troubleshooting` description.** 50 chars, the shortest on the site. Extend to name the actual failure modes (wrong network, missing Sepolia ETH, failed approvals, stale quotes, reverted tx). `L / L`
- [x] **`BlogPostCard` image dimensions.** `components/BlogPostCard.jsx:6` renders a remote `<img>` with no `width`/`height` → CLS on `why-polaris`. Add explicit dimensions or a fixed `aspect-ratio`. `L / L`
- [x] **Optimize `og-image.png`.** Done — lossless `oxipng` 193KB → 136KB (−29%); pngquant rejected (visible gradient banding on the brand card). `L / L`
- [x] **Sanitize inline HTML in `llms-full.txt`.** ~12 lines leak `<strong>`/`<em>`/`<code>` from literal HTML in MDX. Convert inline tags in the sanitizer and tighten `validateCleanLlmsFull` (`scripts/generate-llms.mjs:204`) so it can't regress. `L / L`
- [x] **Enrich `TechArticle` with `articleSection`.** Done — `articleSection` derived from the first path segment (e.g. "Using App", "pETH"); absent on home. `keywords` deferred (kept the seo/page boundary clean, per the note). `L / L`

---

## Owner-blocked inputs

These need information that is **not in the repo** — do not guess or invent values:

| Needed | Used by | Blocks |
| --- | --- | --- |
| Official X/Twitter handle | `twitter:site`/`creator` | #10 |
| Official social URLs (X, GitHub org, Discord/Telegram, CoinGecko/DefiLlama) | `Organization.sameAs` | #3 (social portion only) |
| Decision on AI training-crawler policy | `robots.txt` | #11 |
| `docs.polarisfinance.io` DNS + GitHub Pages custom-domain config | CNAME + env flip | #6 |

The non-social parts of #3 (`alternateName`, `knowsAbout`, `polarisfinance.io` as `sameAs`) and everything else are unblocked.

## Verified corrections (do not action)

Two council premises were corrected during the verification pass — listed so they are not re-investigated:

- **404 already ships `noindex`.** `out/404.html` contains `<meta name="robots" content="noindex"/>`, injected by Next 16 (not in `app/not-found.jsx`). GitHub Pages serves it with a real HTTP 404. No action needed. (The stray self-canonical to home on the 404 is harmless under `noindex` — leave it.)
- **`out/*.txt` are RSC payloads, not markdown mirrors** — see #14.

## Considered and explicitly rejected

- **`HowTo` schema** for step guides (open-a-trove, quickstart): Google removed HowTo rich results in 2023 — no rich-result benefit, added validation surface. Skip. (Optionally add `proficiencyLevel`/`dependencies` to the existing TechArticle instead.)
- **`FAQPage` on `troubleshooting.mdx`:** its sections are symptom statements (`## Wrong network`), not questions — forcing FAQ markup risks a manual action. Do not.
- **Blocking `/_next/` or `/_pagefind/`** in robots: harmful — Google needs JS/CSS to render. Keep them crawlable.
- **Per-section OG images / deduping intentional repetition / re-adding consolidated stub pages:** out of scope. The single shared OG image is acceptable; the June-2026 69→55 consolidation is deliberate.

## Suggested sequencing

1. **One small PR (P0 code):** FAQPage extractor (#1) + Organization fields (#3, non-blocked) + `llms.txt` links (#4) + homepage hero image (#5) + homepage title (#7). All `seo.mjs`/`layout.jsx`/`SystemOverviewFigure.jsx`, low risk, high combined impact.
2. **One content PR (P0/P1):** `using-app/*` titles (#2) + `why-polaris` links & keyword (#9) + `troubleshooting` description (P2). Frontmatter/prose only.
3. **One generator PR (P1):** freshness prop parsing (#8) → unblocks `datePublished`/`article:*` (#15) and populates `llms-index.json`.
4. **Strategic track (owner):** domain migration (#6) once `docs.polarisfinance.io` is provisioned — fixes #4's root path and #3's domain split simultaneously.
5. **Polish pass (P2):** batch the remaining low/low items.
