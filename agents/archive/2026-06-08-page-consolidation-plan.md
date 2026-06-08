# Polaris Docs — Page Consolidation Plan (~33% cut)

Prepared 2026-06-08. **Superseded by the full application-surface execution pass. Current docs now prioritize app-task coverage, canonical references, and no dedicated category landing pages.**

## The problem

The earlier audit counted **69 navigable content pages** in a prior docs shape. The bloat is not from any one section
being too deep — it is from **four overlapping routing layers** that all answer
"where do I go for X?" in parallel:

1. **Hidden alias stubs** (7): `/borrow`, `/earn`, `/swap`, `/zap`, `/guide`,
   `/split`, `/advanced` — 18–20 line callout pages that only point at
   `using-app/*`. Hidden from nav, but real indexed pages.
2. **`` goal-router** (7): "Choose Your Path" — a goal→link table page
   plus 5 thin child pages that are mostly `NextSteps` lists.
3. **`using-app/` app-label router** (10): one hub + per-tab pages. `using-app/guide`
   is a near-duplicate of `goal-router index` (same "choose by goal" table).
4. **Concept sections** (minting, peth, yield, redemptions, polar, stewardship):
   the actual reference content.

Cutting ~33% means **collapsing the routing layers down to one**, merging thin
sibling pages, and keeping the substantive concept + "before-you-sign" pages.

## Target: 69 → ~46 pages (cut 23)

### Tier A — Routing-layer collapse (12 cuts, very low risk)

| # | Cut | Action | Why safe |
|--|--|--|--|
| 1–7 | `/borrow`, `/earn`, `/swap`, `/zap`, `/guide`, `/split`, `/advanced` (top-level hidden stubs) | Delete files; replace with `redirects()`-style aliases. **Note:** site is `output: 'export'` (static) so Next `redirects()` won't emit — instead add the alias slugs as client `<meta refresh>`/canonical, or just drop them and rely on search. | Pure pointer pages, zero unique content. |
| 8–11 | `borrow-passets`, `earn-yield`, `hold-use-peth`, `convert-lock-polar` | Fold all four into the existing `goal-router index` table (already links to the deeper concept pages). | They are link-list stubs (35–40 lines) duplicating the index's job. |
| 12 | `using-app/guide` | Delete; its "choose by goal" table is the same as `goal-router index`. Keep one router. | Direct duplicate. |

After Tier A: keep `goal-router index` (goal router) + `using-app/index` (app-label
router) + `safety-verification` + `develop` as the surviving routers.

### Tier B — Merge thin siblings within sections (8 cuts, low risk)

| # | Cut | Merge into |
|--|--|--|
| 13 | `using-app/analytics` | `using-app/dashboard` → "Dashboard & Analytics" (both are read-only status surfaces). |
| 14 | `yield/deposit-to-stability-pool` (how-to) | `yield/stability-pool` as a "Deposit" section (also has the known duplicate-anchor bug). |
| 15 | legacy conversion how-to route | `polar/conversion-auctions` (mechanism + how-to on one page). |
| 16 | `redemptions-liquidations/recovery-mode` | `redemptions-liquidations/liquidations` as a section. |
| 17 | legacy minting overview route | `minting/index` (overview already covers minting concept). |
| 18 | `stewardship/flows` | `stewardship/fee-router` (flows = fee-router detail; also fixes the /flows mobile overflow defect). |
| 19 | legacy POLAR token route | `polar/index` (overview + token basics together). |
| 20 | `peth/floor-price` | `peth/index` (floor price is a bonding-curve property). |

### Tier C — Reach 33% (3 cuts, judgment calls — confirm with owner)

| # | Cut | Action | Caveat |
|--|--|--|--|
| 21 | `why-polaris` | Fold into `index` / `core-concepts`. | Three intro pages (index, why-polaris, core-concepts) overlap. |
| 22–23 | `explainers/5-min` **or** `explainers/2-min`+`10-min` → one page | Consolidate timed explainers into a single page with sections/tabs. | ⚠️ Memory `docs-intentional-repetition`: the timed explainers are **deliberately** redundant. **Do not cut without owner sign-off.** If owner vetoes, take the 2 cuts from elsewhere (e.g. merge `using-app/advanced`→`using-app/index`, `using-app/dashboard`→`using-app/index`). |

## What is explicitly KEPT (do not touch)

- All concept reference pages with real depth: `minting/open-a-trove`,
  `minting/managing-your-trove`, `peth/split`, `peth/index`,
  `yield/stability-pool`, `redemptions`, `liquidations`, `stewardship/stewardship`,
  `stewardship/vepolar`, `polar/tokenomics`.
- `using-app/{swap,borrow,earn,split,zap}` — they carry app-specific
  "before-you-sign" checks (a top-33 must), not just concept restatement.
- All `resources/*` (testnet, glossary, faq, contracts, audits, risk, brand) —
  reference, each load-bearing.
- `safety-verification` — top-33 wants this *promoted*, not cut.

## Execution sequence (when approved)

1. Branch off `main`.
2. **Tier A first** — delete 7 alias files + 4 paths children + using-app/guide;
   expand `goal-router index` to absorb the 4 goal rows; remove their `_meta.js` keys.
3. **Tier B** — for each merge: move the unique content as a `##` section into the
   target page, add a redirect/anchor note, delete source, update `_meta.js`.
4. Update every inbound link: `grep -rn "/borrow\b\|legacy borrow route\|using-app/guide\| ...` across `content/` before deleting each page.
5. Run the existing guards: `npm run check:links`, `lint:content`, `build`,
   `check:pagefind`, `test:e2e`, and regenerate `llms.txt` / sitemap
   (`chore(llms): sync` per recent commit history).
6. Update `MEMORY.md` if section structure changes invalidate a stored memory.

## Risk notes

- **Static export**: no server redirects. Deleting alias slugs means old
  `/borrow`-style URLs 404 unless we emit client-redirect stub HTML. Decide:
  accept 404 (slugs are new, low external linkage) vs keep tiny redirect stubs.
- **Search/SEO**: fewer pages = cleaner Pagefind index; ensure merged content
  keeps the keywords (fpETH, vpETH, zap, etc.) the top-33 search work added.
- **Inbound links**: the biggest implementation cost is rewiring `NextSteps` and
  body links that point at folded pages. Must grep exhaustively before each delete.
- **Intentional repetition**: respect the `docs-intentional-repetition` memory —
  explainers and hub pages are deliberate; Tier C explainer cut is opt-in only.
```
```
