# Polaris Docs Search Experience Upgrade Plan

Date: June 9, 2026

**Status:** Plan approved June 9, 2026. **Chosen scope: Tier A + Tier B + mobile sheet + the section-filter-chips item from Tier C.** No code changed yet; build starts at Phase 0. This is the design brief.

Focus per request: **result display and navigation**. Everything else (index hygiene, relevance, visual identity) is in service of those two.

## Executive summary

Search works, but it is stock Nextra. The results panel carries none of the Celestial Night Sky identity, the result rows give a newcomer no sense of *where* a hit lives in the system, and two concrete defects degrade relevance:

1. **Excerpt pollution (P0).** `<PageStatusBanner>` sits at line 8 on nearly every page, inside the Pagefind-indexed `<main>`. It becomes the page-level excerpt, so results read "Manage Trove · Public Testnet 1 · Last verified June 8, 2026 · Launch status" instead of the actual content. Visible in the mobile screenshot.
2. **Dead search boost (P0 bug).** `SearchBoost` in `app/[[...mdxPath]]/page.jsx` sets both `data-pagefind-ignore` and `data-pagefind-meta`. The ignore wins, so the curated boost vocabulary ("faucet", "stale quote", "official app URL", etc.) is neither indexed nor captured. Searching those terms finds nothing. (Already flagged in `cleanup-upgrade-plan.md`.)

The architecture is friendly to this work: `<Layout search={...}>` accepts a **fully replaceable** search element (it defaults to Nextra's `<Search />`). So we can restyle in place for free, and swap in our own component when we want richer result structure, without forking the theme.

Recommended direction: **a brand-styled, forked search component** (Tier B below) on top of the index-hygiene fixes (Tier A, which are prerequisites and cheap). Selected Tier C facets are optional follow-ups.

## How search is wired today (the levers)

| Layer | What it is | What we can change |
| --- | --- | --- |
| Engine | Pagefind, built `postbuild` over `out/`, synced to `public/_pagefind` | Index hygiene (`data-pagefind-ignore`/`-body`/`-meta`/`-filter`/`-weight`), ranking, sort, filters |
| Component | Nextra `<Search>` (`nextra/components`), a headless `Combobox` calling `window.pagefind.debouncedSearch` | Props: `placeholder`, `emptyResult` (a React node), `errorText`, `loading`, `searchOptions`, `className`. Result **structure is hardcoded** (page-title group header → sub-result rows of `title` + HTML `excerpt`). |
| Mount | `app/layout.jsx` → `<Layout search={…}>`. Default is `<Search />` | Pass our own element here. No theme fork needed. |
| Position | Panel is portaled to `<body>`, positioned by floating-ui; `components/SearchPanelFix.jsx` re-aligns it to the full-width input | Replaceable once we own the component |
| Styling | `globals.css` styles the navbar input only. **The results panel internals (group headers, rows, `<mark>`, scrollbar) are 100% default Nextra.** | Full restyle available |

Key consequence: **anything visual or structural about a result row requires either CSS (cosmetic) or owning the component (structure).** The component is ~120 lines of real logic over a stable Pagefind API; forking is low-risk.

## Problems today (evidence-based)

| # | Area | Problem | Evidence |
| --- | --- | --- | --- |
| 1 | Relevance | Status-banner chrome pollutes every page excerpt | Screenshot 3; `PageStatusBanner` at `content/**:8`, no ignore attr |
| 2 | Relevance | Curated boost terms are dead (ignore cancels meta, and meta is not body-searchable anyway) | `app/[[...mdxPath]]/page.jsx:118-121` |
| 3 | Display | No location context. A row shows a heading and excerpt but not its section ("Minting & Troves › Manage your Trove"). Newcomers cannot orient. | Screenshots 1-3 |
| 4 | Display | Zero brand identity. Generic gray panel, gray-400 excerpts, default `primary-600/80` highlight. Reads "generic dev-docs", an explicit anti-reference. | `globals.css` has no results-panel rules |
| 5 | Display | Excerpts are long, dense, low-contrast; matched term is hard to scan | Screenshots 1-2 |
| 6 | Display | Flat per-page grouping with no section/type affordance; concept vs app-task vs reference all look identical | Screenshots |
| 7 | Navigation | Panel has no result count and no keyboard legend (↑↓ / ↵ / esc). The `⌘K` hint is on the input only. | Search component |
| 8 | Navigation | Empty/initial state is blank. A focused, queryless search teaches nothing, despite a newcomer audience that benefits from "Start here". | Search component (`results=[]` renders nothing) |
| 9 | Navigation | "No results" is a bare string with no recovery path (FAQ, Troubleshooting, llms.txt) | `emptyResult` default |
| 10 | Navigation | Mobile is a constrained dropdown under a narrow input, not a thumb-friendly sheet | Screenshot 3 |

## The option space (explored broadly)

Three tiers, additive. Each is independently shippable.

### Tier A — Hygiene + brand restyle (no component fork)

Cheap, high-floor, no structural risk. Should ship regardless of how far we go.

- **Fix excerpt pollution.** Add `data-pagefind-ignore` to `PageStatusBanner` (and audit other chrome: `NextSteps`, `PageStatusBanner`, any banner/footer rendered inside `<main>`). Excerpts then start from real prose.
- **Fix the search boost.** Drop `data-pagefind-ignore` from `SearchBoost`; keep the node visually hidden but **indexed**, with low `data-pagefind-weight` (e.g. `0.3`) so boost terms are findable without outranking real content. (Metadata alone is not searchable text in Pagefind; it has to be indexed body.)
- **Brand the panel via CSS.** Style `.nextra-search-results`, the group header, the row, the focused row, `<mark>`, and `.nextra-scrollbar` to the navy/star/gold system. Raise excerpt contrast to clear 4.5:1 (PRODUCT.md requires it). Replace the default highlight with a brand gold underline/wash.
- **Richer copy via props.** `placeholder="Search the docs…"`; `emptyResult` as a React node (recovery links); `errorText` on brand.
- **Tune `searchOptions`.** Shorter, denser excerpts; verify sub-result counts.

Outcome: same structure, but on-brand, readable, and accurate. Roughly the 70% win.

### Tier B — Forked result component (recommended core)

Own `components/PolarisSearch.jsx`, pass it to `<Layout search={…}>`. Same Pagefind data, richer rendering. Unlocks the display and navigation asks:

- **Section context per row.** Derive the top-level section from the result URL + `content/_meta.js` titles and render a breadcrumb eyebrow ("Minting & Troves") above the matched heading. Optionally back it with a `data-pagefind-meta="section:…"` so it travels with the result instead of being re-derived.
- **Type affordance.** A small, color-keyed marker distinguishing Concept / App task (`using-app/*`) / Reference (`resources/*`) / Status. Uses the existing token hues (pETH blue, POLAR purple, gold), never color alone (label + shape too).
- **Result count + keyboard legend footer.** Persistent "N results · ↑↓ navigate · ↵ open · esc close" strip.
- **Initial "Start here" state.** When focused with no query: a short curated set (Quickstart, Core Concepts, Open a Trove, Why Polaris) and, if we add it, recent searches from `localStorage`.
- **Recovering "No results" state.** Suggest FAQ, Troubleshooting, and the llms.txt firehose.
- **Mobile full-screen sheet.** Replace the cramped dropdown with a full-height overlay; retires most of `SearchPanelFix.jsx`.

Outcome: results that orient a newcomer and navigate by keyboard or thumb. This is the heart of the request.

### Tier C — Faceting and relevance depth (optional follow-ups)

- **Section filter chips** via `data-pagefind-filter="section:…"`: scope a query to Minting, pETH, Yield, POLAR, etc. Worthwhile at ~55 pages if users report noise; otherwise defer.
- **Relevance ranking** via `pagefind.options({ ranking })` (term frequency vs page length) and per-page `data-pagefind-weight` to float canonical pages (Core Concepts, Quickstart) above deep references.
- **Section jump keys** (e.g. `⌥↑/↓` to skip between page groups) for power users.
- **Query history / popular searches**, if we want to learn from usage (static site: `localStorage` only, no backend).

## Recommended direction

**Approved scope (June 9, 2026): full Tier A + full Tier B (including the mobile sheet) + section filter chips from Tier C.** A fixes the relevance bugs and brands the panel; B delivers the display and navigation upgrade the request is about; the section filter chips add query scoping at ~55 pages. The remaining Tier C items (ranking weights, section-jump keys, query history) stay as later follow-ups.

Build order is unchanged from the phase table below: Phase 0 hygiene first, then restyle, then the forked component, then the mobile sheet, then the section filter chips.

## Result display spec (the focus)

Anatomy of one result group, redesigned:

```
┌────────────────────────────────────────────────────────┐
│  ● Minting & Troves                          (eyebrow)  │  ← section, token-hued dot
│  Manage your Trove                            (h, page) │  ← page title, serif, links to page
├────────────────────────────────────────────────────────┤
│  ▸ Add collateral                          (row, focus) │  ← matched heading, sans semibold
│    …deposit ETH to lower your ⟨LTV⟩ and reduce…  (1-2L) │  ← excerpt, star ink, gold mark
│  ▸ Values to check                                      │
│    …keep ⟨LTV⟩ under the liquidation threshold…         │
└────────────────────────────────────────────────────────┘
```

- **Grouping:** keep per-page grouping (intentional and good); add the **section eyebrow** above the page title. Group header is sticky within the scroll area so context stays visible.
- **Density:** excerpt capped to ~2 lines (`-webkit-line-clamp`), tightened length via `searchOptions`. Comfortable row padding; clear gap between groups.
- **Highlight:** matched terms (`<mark>`) get a gold wash + underline, not the default solid block. Readable, on brand, distinct from links.
- **Color/contrast:** excerpt text moves from gray-400 to a star-derived ink that clears 4.5:1 on the panel surface. Type dot/label uses pETH/POLAR/gold hues; meaning is also carried by the text label and dot shape.
- **Focus state:** focused row gets a navy-mid surface + gold left-edge focus ring (within the row, not a banned side-stripe accent), so keyboard position is obvious.
- **Panel surface:** navy glass tuned to the brand (subtle, purposeful, not default glassmorphism), star border, soft elevation. One panel, no nested cards.

### States (all designed, not half)

| State | Treatment |
| --- | --- |
| Initial (focused, no query) | "Start here" curated list + optional recent searches |
| Loading | Inline spinner with "Searching…"; no layout jump |
| Results | Grouped per above |
| No results | "No matches for ‘x’." + links to FAQ, Troubleshooting, llms.txt |
| Error | On-brand `errorText`; dev notice preserved (Pagefind needs a build) |
| Long/short text | Title truncates to 1 line; excerpt clamps to 2; no overflow at any width |

## Navigation spec (the focus)

- **Keyboard:** the headless `Combobox` already gives ↑↓ to move and ↵ to open; we make it legible with the footer legend and a visible focused-row treatment. `/` and `⌘K`/`Ctrl-K` already focus the input (keep; surface in the empty state).
- **Result count:** "N results" in the footer so users gauge breadth before scrolling.
- **Within-page vs cross-page:** preserve the existing same-page anchor jump (no full reload) vs `router.push` for other pages; ensure the target heading scrolls into view (the rows already carry `scroll-m-12`).
- **Mobile:** full-screen sheet with a large input, big touch targets (44px min already enforced), and a clear close affordance. Retires the JS realignment hack on mobile.
- **Section jump (Tier C):** optional `⌥↑/↓` to hop between page groups.
- **Filter chips (Tier C):** scope to a section; reflected in the count.

## Index and relevance hygiene (prerequisite)

| Action | File | Why |
| --- | --- | --- |
| `data-pagefind-ignore` on status banner | `components/PageStatusBanner.jsx` | Stop excerpt pollution (P0) |
| Audit other in-`main` chrome for ignore | `components/NextSteps.jsx`, others | Same |
| Remove ignore; keep indexed + low weight | `app/[[...mdxPath]]/page.jsx` SearchBoost | Make boost terms findable (P0) |
| Optional `data-pagefind-meta="section:…"` | page route / frontmatter | Carry section to results without re-derivation |
| Optional `data-pagefind-weight` on canonical pages | page route | Float Core Concepts / Quickstart |
| Optional `data-pagefind-filter` | page route | Section facets (Tier C) |

Re-verify against the built `out/_pagefind` after each change; `scripts/check-pagefind.mjs` already gates page count and shards.

## Visual and motion

- **Palette:** navy ramp surface, star ink, gold accent for highlight/focus, token hues for type markers. Restrained per the product register.
- **Type:** sans for rows and excerpts (UI); serif reserved for the page title in the group header, matching the site's editorial voice. No display fonts in row body.
- **Motion:** keep the existing 200ms open/close; respect `prefers-reduced-motion` (crossfade). No orchestration. Staggered row entrance only if it stays under ~150ms total and never blocks typing.

## Accessibility

- Combobox semantics come from headless UI; preserve roles and the input's accessible name.
- Excerpt and type-label contrast ≥ 4.5:1, verified on the panel surface (dark and light).
- Type/section never encoded by color alone (label + dot shape).
- Full keyboard path including the new footer actions; reduced-motion fallback; focus-visible ring on the focused row.
- Target WCAG 2.2 AA per PRODUCT.md.

## Phased implementation plan

Each phase ends at a verification gate. Build is `next build --webpack`; search only works against the built artifact, so all visual checks run on `npm run serve` (the `out/` export), inspected in-browser at desktop, tablet, and mobile.

| Phase | Scope | Verify |
| --- | --- | --- |
| 0. Hygiene (Tier A relevance) | Ignore status banner; fix SearchBoost weight | Build; search a boost term ("faucet") returns its page; excerpts no longer start with banner text; `check:pagefind` passes |
| 1. Brand restyle (Tier A visual) | CSS for panel, rows, marks, scrollbar, contrast; richer `placeholder`/`emptyResult`/`errorText` props | Screenshot the 6 states at 3 widths; contrast ≥ 4.5:1; reduced-motion checked |
| 2. Forked component (Tier B) | `components/PolarisSearch.jsx` via `<Layout search>`; section breadcrumb + type marker + count/legend footer + initial + no-results states | e2e search smoke (`tests/`); keyboard nav by hand; section labels correct for a sample across sections |
| 3. Mobile sheet (Tier B) | Full-screen overlay; reconcile/retire `SearchPanelFix.jsx` | Mobile viewport in-browser; no clipping; close works; desktop unaffected |
| 4. Section filter chips (Tier C) | `data-pagefind-filter="section:…"` + chip UI in the panel; count reflects the active scope | Scope a query to a section; count updates; chips keyboard-reachable; relevance spot-check |

Gates: each phase must pass `npm run lint`, `npm run build`, `check:pagefind`, and the existing Playwright e2e set before the next begins. No phase ships with a half-built state.

## Risks and open questions

- **Forking the Nextra Search couples us to its Pagefind contract.** Stable today (`debouncedSearch`, `.data()`, `sub_results`), but a Nextra major could shift it. Mitigation: keep the fork thin and the Pagefind calls isolated.
- **`SearchPanelFix.jsx` interplay.** Once we own the component (and especially the mobile sheet), the JS realignment hack should mostly retire; confirm desktop alignment still holds.
- **Section derivation source.** Derive from URL + `_meta.js`, or stamp `data-pagefind-meta`? URL-derivation is zero-maintenance but fragile if routes move; metadata is explicit but adds per-page annotation. Leaning URL-derivation with a single shared map.
- **Boost terms in excerpts.** Indexing the hidden vocabulary risks it surfacing inside excerpts. Low weight plus short length should keep it out of view; verify after Phase 0.
- **Scope of Tier C.** Faceting earns its keep only if results feel noisy at current page count. Recommend shipping A+B first, then deciding from real use.

## Next step

Scope is locked (A + B + mobile sheet + section filter chips). Build begins at **Phase 0 (hygiene)**: ignore the status banner in the index and fix the dead search boost, verified against a fresh `out/_pagefind` build.
