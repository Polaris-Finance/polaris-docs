# Polaris Docs Wordiness Cleanup Plan

Date: June 8, 2026

Note: the request named `/agebts/wordiness-fix.md`. This repo has an `agents/`
planning workspace and no `agebts/` directory, so this plan is placed at
`agents/wordiness-fix.md`.

## Goal

Reduce wordiness, repetition, and scattered explanations without weakening user
safety or app-task coverage.

The target is a docs set where:

- Each page has one reader and one job.
- Each concept has one full explanation.
- Each volatile fact has one canonical reference page.
- Task pages tell users what to do, what to check, what can fail, and where to go
  next.
- Repeated caveats become one-line reminders plus links.

Current baseline from local scan:

- `content/**/*.mdx`: about 29,761 authored words.
- Heaviest pages: `resources/index`, `stewardship/fee-router`,
  `redemptions-liquidations/index`, `resources/risk-disclosure`,
  `minting/managing-your-trove`, `polar/conversion-auctions`, and
  `stewardship/index`.
- Largest repetition clusters: launch/testnet caveats, parameter ownership,
  ICR/redemption warnings, pETH floor assumptions, POLAR conversion/dilution,
  yield routing, POLAR Staking vs vePOLAR, and "pending audited deployment"
  status language.

Suggested cut target for this pass: remove 3,500 to 5,000 words from authored
MDX, roughly 12% to 17%, mostly by merging duplicate explanations and replacing
local restatements with links.

## Research Basis

This plan combines:

- Local corpus scans for word count, line count, repeated headings, repeated
  n-grams, internal-link frequency, long sentences, and status/hedge density.
- Review of current planning reports in `agents/`.
- Three read-only sidecar reviews:
  - `content/using-app/*.mdx` and `content/minting/*.mdx`
  - `content/resources/*.mdx`, `content/peth/*.mdx`, `content/polar/*.mdx`,
    `content/yield/*.mdx`, and `content/stewardship/*.mdx`
  - top-level `content/*.mdx`, `content/redemptions-liquidations/*.mdx`,
    `content/troubleshooting.mdx`, and active/archived `agents/*.md`

No existing content files were edited during this planning pass.

## Editorial Rules

Use the efficient-writing principles as hard constraints:

1. Identify the target.
   - Before editing a page, write its target reader and one-sentence job.
   - If a paragraph serves a different reader, move or delete it.

2. Organize before rewriting.
   - Keep one outline per page type.
   - Task pages: what it does, before you start, steps/checks, common failures,
     risks/links, next actions.
   - Concept pages: definition, why it matters, how it works, risks/limits,
     related tasks.
   - Reference pages: scope, table/list, freshness/source, verification links.

3. Optimize for scanning.
   - Prefer tables and bullets for exact facts.
   - Keep paragraphs to 2 or 3 sentences.
   - Break sentences over roughly 25 words unless they are unavoidable.

4. Revise aggressively.
   - Remove adjectives, adverbs, metaphors, and protocol-positioning phrases
     unless they help a user make a decision.
   - Keep the first good explanation. Replace later repeats with links.

## Canonical Ownership Map

Use this map to decide what gets cut from other pages.

| Topic | Owner | Other pages may say |
| --- | --- | --- |
| Current phase, app URL, live/not-live status | `content/launch-status.mdx` | One-line status reminder plus link |
| Testnet path from wallet to first action | `content/quickstart.mdx` | "Follow Quickstart" |
| Signing, frontend, wallet, and phishing checks | `content/resources/safety-verification.mdx` | "Verify before signing" |
| Numeric protocol values and pending/final status | `content/resources/parameters.mdx` | Parameter name plus link, no duplicate table |
| Contract addresses and verification | `content/resources/contracts.mdx` | "Check Contracts & Addresses" |
| Testnet artifact source and manifest paths | `content/resources/testnet.mdx` | "Artifacts live on Testnet" |
| Complete risk taxonomy | `content/resources/risk-disclosure.mdx` | One local risk sentence plus link |
| Glossary definitions | `content/resources/index.mdx` | Link to term, no mini-guide |
| System map | `content/core-concepts.mdx` | One-line concept recap |
| Positioning argument | `content/why-polaris.mdx` | Avoid repeating the pitch elsewhere |
| App UI workflows | `content/using-app/*.mdx` | UI-only checks and failure modes |
| Trove mechanics and ICR management | `content/minting/*.mdx` | App pages link to mechanics |
| Redemption mechanism and borrower impact | `content/redemptions-liquidations/index.mdx` | One warning sentence plus link |
| Liquidation closeout path | `content/redemptions-liquidations/liquidations.mdx` | Link from borrower and yield pages |
| Recovery Mode behavior | `content/redemptions-liquidations/recovery-mode.mdx` | Link from liquidation/trove pages |
| pETH floor and floor ratio | `content/peth/floor-price.mdx` | One-sentence link |
| POLAR "why" | `content/polar/index.mdx` | Short intro only |
| POLAR economics/status | `content/polar/tokenomics.mdx` | Exact economic/status details |
| Conversion auction mechanism | `content/polar/conversion-auctions.mdx` | Mechanism details only |
| Yield-source matrix | `content/yield/yield-sources.mdx` | Link from Fee Router/POLAR pages |
| Fee Router mechanics | `content/stewardship/fee-router.mdx` or split page | No repeated yield-source matrix |
| Flows ecosystem sharing | Same page section or a split page | No repeated Fee Router intro |
| Stewardship scope | `content/stewardship/index.mdx` | One-line "bounded stewardship" summary |
| vePOLAR lock mechanics/status | `content/stewardship/vepolar.mdx` | One-line distinction from POLAR Staking |

## P0 Cleanup Targets

### 1. Consolidate redemptions into one borrower-impact section

File: `content/redemptions-liquidations/index.mdx`

Problem:

- The same rule appears at lines 54, 70, 74, 82, 96, 99, and 107: redemptions
  apply pro-rata to all troves, there is no ICR queue, and higher ICR does not
  exempt the borrower.

Action:

- Merge `How redemptions are distributed`, `Borrower effects`,
  `Who gets redeemed against`, and `For borrowers` into one section:
  `## Borrower impact`.
- Keep one parameter note near the top.
- Keep one worked example.
- End with next actions, not another recap.

Cut target:

- Remove 350 to 550 words.
- Keep the warning strong, but say it once.

### 2. Reduce parameter repetition in redemptions, liquidations, and recovery

Files:

- `content/redemptions-liquidations/index.mdx`
- `content/redemptions-liquidations/liquidations.mdx`
- `content/redemptions-liquidations/recovery-mode.mdx`
- `content/minting/managing-your-trove.mdx`

Problem:

- "Current values live on Parameters / production final pending" appears in many
  local notes and tables.
- `liquidations.mdx` has a long parameter-status table that repeats values owned
  by `resources/parameters.mdx`.

Action:

- Keep numeric values only when they are needed for a worked example.
- Replace local status tables with one compact "Values" sentence linking to
  `Parameters`.
- Where a table is needed, list reader impact without repeating values.

Cut target:

- Remove 300 to 450 words.
- Lower contradiction risk by reducing duplicated numbers.

### 3. Define and enforce `using-app` versus protocol mechanics

Files:

- `content/using-app/*.mdx`
- `content/minting/open-a-trove.mdx`
- `content/minting/managing-your-trove.mdx`

Problem:

- The testnet setup line repeats across app pages.
- `using-app/borrow.mdx` and `using-app/manage-trove.mdx` overlap with
  `minting/open-a-trove.mdx` and `minting/managing-your-trove.mdx`.

Action:

- Keep full setup once on `content/using-app/index.mdx`.
- In child app pages, replace repeated setup with "Start from Dashboard &
  Analytics and verify the current app/network first."
- Make `using-app` pages UI checklists: visible fields, approvals, success
  state, common failures.
- Keep ICR, interest accrual, redemptions, liquidations, and Recovery Mode
  mechanics in `minting` and `redemptions-liquidations`.

Cut target:

- Remove 250 to 400 words across short app pages without making them less useful.

### 4. Consolidate ICR and buffer explanations

Files:

- `content/minting/open-a-trove.mdx`
- `content/minting/managing-your-trove.mdx`
- `content/using-app/manage-trove.mdx`
- `content/redemptions-liquidations/index.mdx`

Problem:

- "ICR protects liquidation, not redemption" and "redemptions reach every open
  trove pro-rata" are explained repeatedly.
- `open-a-trove.mdx` has a full buffer example that overlaps with
  `managing-your-trove.mdx`.

Action:

- Make `managing-your-trove.mdx` the owner for ICR management and buffer
  strategy.
- Reduce `open-a-trove.mdx` to a shorter "choose a buffer" section that links to
  the managing page.
- Keep a one-line redemption warning in app pages.

Cut target:

- Remove 300 to 500 words.

### 5. Consolidate the POLAR story

Files:

- `content/polar/index.mdx`
- `content/polar/tokenomics.mdx`
- `content/polar/conversion-auctions.mdx`
- `content/stewardship/vepolar.mdx`
- `content/resources/index.mdx`

Problem:

- "Burn pETH to mint POLAR", productive dilution, floor growth, bots/searchers,
  and pending bounds are restated across multiple pages.
- POLAR Staking versus future vePOLAR is repeated in the overview, tokenomics,
  vePOLAR, and glossary.

Action:

- `/polar`: short "why POLAR exists" page.
- `/polar/tokenomics`: economics, staking versus vePOLAR distinction, status,
  and pending numbers.
- `/polar/conversion-auctions`: mechanism only.
- `/stewardship/vepolar`: locking and stewardship rights only.
- Glossary: one-sentence definitions plus links.

Cut target:

- Remove 500 to 800 words.
- Replace "most protocol-synergetic action possible" with "burn pETH to mint
  POLAR" except in at most one positioning paragraph.

### 6. Make pETH Floor Price the only full floor explanation

Owner: `content/peth/floor-price.mdx`

Trim repeats in:

- `content/peth/index.mdx`
- `content/resources/index.mdx`
- `content/resources/risk-disclosure.mdx`
- `content/polar/index.mdx`
- `content/polar/tokenomics.mdx`
- `content/polar/conversion-auctions.mdx`

Problem:

- "Designed to rise/lift the floor" and "under curve assumptions/invariants"
  appear across pETH, POLAR, glossary, and risk pages.

Action:

- Keep the assumptions, floor ratio, and drawdown framing in
  `peth/floor-price.mdx`.
- Other pages get one sentence and a link.

Cut target:

- Remove 250 to 450 words.

### 7. Refocus or split Fee Router & Flows

File: `content/stewardship/fee-router.mdx`

Problem:

- The page is two documents: Fee Router mechanics and Flows ecosystem revenue
  sharing.
- It repeats yield-route explanations already covered in
  `content/yield/yield-sources.mdx`.
- It has the highest status/hedge density in the corpus.

Action option A:

- Keep one page, but add a tighter outline:
  - Fee Router: inputs, buffer, outputs, operator checks.
  - Flows: formula, participant lifecycle, token-emission contrast.
- Remove duplicate yield-source explanations and keep the detailed matrix in
  `yield/yield-sources.mdx`.

Action option B:

- Split into `fee-router.mdx` and `flows.mdx` only if navigation can support the
  extra page and the split reduces repetition.

Cut target:

- Remove 500 to 900 words if kept as one page.

## P1 Cleanup Targets

### 8. Tighten Recovery Mode without merging it away

File: `content/redemptions-liquidations/recovery-mode.mdx`

Keep this page separate. It answers a distinct user question.

Cut:

- Repeated "protective state" language.
- Repeated "liquidation eligibility is unchanged" variants.
- Ending recap if the warning and action list already say it.

Keep:

- TCR definition.
- Normal Mode versus Recovery Mode table.
- One example.
- One "how to act" list.

Cut target: 150 to 250 words.

### 9. Tighten Liquidations around two readers

File: `content/redemptions-liquidations/liquidations.mdx`

Readers:

- Borrowers avoiding liquidation.
- Stability Pool depositors understanding first-loss exposure.

Cut:

- Long parameter-status table values owned by `Parameters`.
- Repeated MCR/Recovery Mode values.
- Final recap paragraph if the borrower and depositor warnings remain.

Keep:

- Two-tier liquidation path.
- Collateral Surplus Pool note.
- One borrower warning.
- One Stability Pool depositor warning.

Cut target: 200 to 350 words.

### 10. Clarify the three intro-page jobs

Files:

- `content/index.mdx`
- `content/core-concepts.mdx`
- `content/why-polaris.mdx`

Problem:

- All three explain the system value model.

Action:

- `index.mdx`: gateway. Current status, launch timeline, three engines, links.
- `core-concepts.mdx`: one-page system map and definitions.
- `why-polaris.mdx`: positioning/trade-off argument only.

Cut:

- Duplicate flywheel explanation outside `core-concepts`.
- Long source caveat in `why-polaris.mdx`.
- Strong persuasive phrasing in docs pages; leave essay tone to blog cards.

Cut target: 250 to 450 words.

### 11. Shorten glossary entries

File: `content/resources/index.mdx`

Problem:

- Several glossary entries have become mini-guides.
- Repeated owner/source/canonical phrasing adds internal-doc jargon.

Priority entries to shorten:

- Bonding curve
- Conversion auction
- Fee Router
- Floor price
- Inward-facing / Outward-facing
- Oracle
- pETH
- Recovery Mode
- TCR
- vePOLAR

Rule:

- 1 sentence for simple terms.
- 2 sentences only if the second sentence disambiguates a common confusion.
- Then link to the canonical page.

Cut target: 500 to 800 words.

### 12. Trim stewardship tone and duplicate pending-status blocks

Files:

- `content/stewardship/index.mdx`
- `content/stewardship/vepolar.mdx`
- `content/stewardship/fee-router.mdx`

Problem:

- "Bounded", "hardcoded bounds", "immutable core", and "pending audited
  deployment" repeat frequently.
- The named DAO/protocol comparison in `stewardship/index.mdx` reads like blog
  material.

Action:

- Keep one concise status callout per page.
- Keep the comparison table, but move or cut named-protocol critique.
- Replace "extraction arena", "denature", and "load-bearing" where direct terms
  work.

Cut target: 400 to 650 words.

### 13. Merge vulnerability-reporting warnings

File: `content/resources/audits-security.mdx`

Problem:

- The bug-bounty/disclosure warning repeats around lines 22 and 33.

Action:

- Keep one "Until the official channel is published..." warning.
- Keep the future program fields as a short list.

Cut target: 75 to 125 words.

### 14. Tighten yield pages

Files:

- `content/yield/index.mdx`
- `content/yield/yield-sources.mdx`
- `content/stewardship/fee-router.mdx`
- `content/polar/tokenomics.mdx`

Problem:

- Yield routing is explained in several places with different levels of detail.

Action:

- `yield/index.mdx`: Stability Pool depositors and first-loss mechanics.
- `yield/yield-sources.mdx`: full yield-source matrix.
- `fee-router.mdx`: routing implementation only.
- `polar/tokenomics.mdx`: POLAR recipient/status view only.

Cut target: 250 to 400 words.

### 15. Clean pAsset catalog tone

File: `content/minting/passet-catalog.mdx`

Targets:

- Long opening paragraph that mixes definition, exceptions, assumptions, and
  catalog governance.
- Adjectives and asides: "novelty", "honest", "stranger", "violent",
  "barely".

Action:

- Make the page table-first.
- Keep pUSD/pGOLD testnet-active status.
- Keep illustrative/future status for pCHF/pBigMac.
- Move broader "mint anything" argument to `why-polaris` or blog links.

Cut target: 150 to 250 words.

## P2 Cleanup Targets

### 16. Standardize status callouts

Problem:

- "Pending audited deployment", "forthcoming", "final bounds pending", and
  "not live yet" are repeated in many forms.

Action:

- Use one pattern per page:
  - `Current status: X is testnet/live/forthcoming. Use [owner] for exact Y.`
- Avoid repeating full lists of missing fields across multiple pages.

Likely files:

- `content/polar/*`
- `content/stewardship/*`
- `content/resources/*`
- `content/redemptions-liquidations/*`

### 17. Replace jargon and promotional phrasing

Search and replace by judgment, not mechanically:

- "most protocol-synergetic action possible" -> "burn pETH to mint POLAR"
- "denature" -> "change the base protocol" or "weaken the design"
- "load-bearing" -> "necessary" or "material"
- "extraction arena" -> "capture risk"
- "hard-asset" -> "pETH or pAsset" where specific
- "drifted dirtier" style phrases -> neutral explanation
- "your own mini central bank" -> plain CDP mechanics

### 18. Remove duplicate blog-card pressure

Problem:

- Adjacent concept pages sometimes point to the same blog post after already
  covering the concept.

Action:

- Keep blog cards where they add a deeper essay path.
- Remove duplicate cards when two nearby docs point to the same post and the page
  already has strong next actions.

Likely clusters:

- pETH and floor-price pages.
- POLAR overview, tokenomics, and conversion pages.
- Stewardship and vePOLAR pages.

### 19. Long-sentence pass

Prioritize files with many long sentences or dense tables:

- `content/polar/conversion-auctions.mdx`
- `content/redemptions-liquidations/index.mdx`
- `content/resources/risk-disclosure.mdx`
- `content/redemptions-liquidations/recovery-mode.mdx`
- `content/redemptions-liquidations/liquidations.mdx`
- `content/polar/tokenomics.mdx`
- `content/stewardship/fee-router.mdx`
- `content/minting/managing-your-trove.mdx`
- `content/stewardship/index.mdx`
- `content/resources/index.mdx`

Rules:

- Split paragraphs longer than 3 sentences.
- Split sentences longer than 25 words unless they are table/context lines.
- Convert list-like prose into bullets.

### 20. Active agent-plan cleanup

The active planning area already says archived reports are historical. Do not let
old archive recommendations override current docs direction.

Action:

- Keep `agents/full-application-surface-docs-report.md` as supporting principles.
- Keep `agents/cleanup-upgrade-plan.md` as broader cleanup context.
- Treat archived page-count and merge recommendations as context only.

## Candidate Removals or Merges

Do not delete these automatically. Decide after the P0 page-owner pass.

| Candidate | Direction | Reason |
| --- | --- | --- |
| `content/using-app/manage-trove.mdx` | Make a thin UI wrapper or merge into `minting/managing-your-trove.mdx` | Strong overlap with mechanics owner |
| `content/using-app/advanced.mdx` | Shorten heavily if app surface is not stable | Broad, generic, and mostly safety links |
| `content/using-app/zap.mdx` | Keep only if Zap is a distinct app tab | Otherwise fold into Swap/Earn as bundled route |
| `content/peth/floor-price.mdx` | Keep separate, but make it sole floor owner | Avoid repeating floor assumptions elsewhere |
| `content/stewardship/fee-router.mdx` | Split only if it lowers repetition | Currently two pages in one |
| `content/stewardship/index.mdx` DAO comparison | Cut or move named-protocol critique to blog | Docs should be reference-oriented |

## Explicit Non-Goals

- Do not collapse `Redemptions`, `Liquidations`, and `Recovery Mode` into one
  page. They are distinct mechanics and user questions.
- Do not remove app-task pages just because they are short. The repeated outline
  is useful; the boilerplate inside it is the problem.
- Do not move numeric values out of `Parameters` into narrative pages.
- Do not treat generated files in `out/` or `public/llms*.txt` as authored docs
  for wordiness cleanup.
- Do not rewrite unrelated dirty worktree changes while executing this plan.

## Execution Order

1. Add page-purpose comments to a scratch checklist, not to MDX files:
   - reader
   - job
   - canonical owner links
   - delete targets

2. P0 pass:
   - Redemptions consolidation.
   - Parameter dedupe across redemptions/liquidations/recovery/trove pages.
   - App prerequisite dedupe.
   - ICR/buffer dedupe.
   - POLAR ownership split.
   - pETH floor owner pass.
   - Fee Router/Flows refocus.

3. P1 pass:
   - Glossary trimming.
   - Stewardship tone and status trimming.
   - Audits/security warning merge.
   - Yield-routing dedupe.
   - Intro-page role separation.

4. P2 pass:
   - Jargon search.
   - Long-sentence pass.
   - Duplicate blog-card pass.

5. Validation:
   - `npm run lint:content`
   - `npm run check:links`
   - `npm run build`
   - `npm run check:pagefind`

## Acceptance Criteria

The cleanup is done when:

- `app.testnet.polarisfinance.io` / Sepolia setup is fully stated only in
  `Launch Status`, `Quickstart`, and the top app-surface page; child app pages
  use short reminders.
- `Parameters` is the only full numeric table owner.
- Redemptions says "pro-rata, no ICR queue, no exemption" once, in the borrower
  impact section.
- POLAR pages no longer restate the full conversion/dilution story on every page.
- pETH floor assumptions live in `peth/floor-price.mdx`; other pages link to it.
- Glossary entries are definitions, not mini-guides.
- Each page ends with next actions or links, not a summary paragraph repeating
  the page thesis.
- The authored MDX word count falls by at least 3,500 words or the remaining
  repetitions are explicitly justified by page role.
