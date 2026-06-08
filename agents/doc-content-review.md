# Polaris Docs — Content Concision & Clarity Review

**Date:** 2026-06-08
**Scope:** `content/**/*.mdx` — 40 files. Prose-quality only (accuracy was verified separately in `doc-accuracy-report.md`).
**Mandate:** Make the copy maximally concise and clear. Named weakness: occasional wordiness.
**Method:** Two-stage pipeline per file — propose tightening edits → an independent second editor verifies (meaning-preserving, on-voice, valid MDX, linter-safe) and applies the survivors in place — then one cross-document consistency pass. All technical claims treated as frozen.

## Outcome

- **69** edits applied across **34/40** files.
- **32304 → 32174** words (**130** cut, 0.4% lighter).
- Edits were subtractive: filler, redundancy, wordy constructions, empty hedging, and passive-where-active. Voice, structure, caveats, and every technical claim preserved.

## Per-file changes

| File | Words | Cut | Applied | Rejected |
|---|---|---:|---:|---:|
| `/home/ahirice/Documents/git/polaris-docs/content/minting/managing-your-trove.mdx` | 1016 → 1006 | 10 | 5 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/stewardship/vepolar.mdx` | 609 → 599 | 10 | 3 | 1 |
| `/home/ahirice/Documents/git/polaris-docs/content/explainers/10-min.mdx` | 1793 → 1784 | 9 | 4 | 1 |
| `/home/ahirice/Documents/git/polaris-docs/content/redemptions-liquidations/redemptions.mdx` | 1697 → 1688 | 9 | 3 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/explainers/5-min.mdx` | 862 → 854 | 8 | 4 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/polar/tokenomics.mdx` | 848 → 840 | 8 | 4 | 1 |
| `/home/ahirice/Documents/git/polaris-docs/content/peth/bonding-curve.mdx` | 954 → 948 | 6 | 3 | 1 |
| `/home/ahirice/Documents/git/polaris-docs/content/polar/conversion-auctions.mdx` | 927 → 921 | 6 | 3 | 2 |
| `/home/ahirice/Documents/git/polaris-docs/content/paths/develop.mdx` | 321 → 316 | 5 | 1 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/yield/stability-pool.mdx` | 922 → 917 | 5 | 3 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/resources/faq.mdx` | 933 → 928 | 5 | 2 | 1 |
| `/home/ahirice/Documents/git/polaris-docs/content/resources/glossary.mdx` | 1199 → 1194 | 5 | 3 | 2 |
| `/home/ahirice/Documents/git/polaris-docs/content/minting/passet-catalog.mdx` | 547 → 543 | 4 | 2 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/yield/yield-sources.mdx` | 687 → 683 | 4 | 2 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/core-concepts.mdx` | 681 → 678 | 3 | 2 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/paths/safety-verification.mdx` | 321 → 318 | 3 | 1 | 1 |
| `/home/ahirice/Documents/git/polaris-docs/content/stewardship/stewardship.mdx` | 1393 → 1390 | 3 | 3 | 2 |
| `/home/ahirice/Documents/git/polaris-docs/content/index.mdx` | 2506 → 2504 | 2 | 1 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/why-polaris.mdx` | 636 → 634 | 2 | 1 | 1 |
| `/home/ahirice/Documents/git/polaris-docs/content/getting-started.mdx` | 589 → 587 | 2 | 1 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/explainers/2-min.mdx` | 399 → 397 | 2 | 1 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/minting/open-a-trove.mdx` | 930 → 928 | 2 | 2 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/minting/minting-passets.mdx` | 603 → 601 | 2 | 1 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/peth/floor-price.mdx` | 580 → 578 | 2 | 2 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/polar/participate-in-conversion.mdx` | 587 → 585 | 2 | 2 | 1 |
| `/home/ahirice/Documents/git/polaris-docs/content/redemptions-liquidations/recovery-mode.mdx` | 956 → 954 | 2 | 2 | 1 |
| `/home/ahirice/Documents/git/polaris-docs/content/yield/deposit-to-stability-pool.mdx` | 542 → 540 | 2 | 1 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/resources/contracts.mdx` | 813 → 811 | 2 | 1 | 1 |
| `/home/ahirice/Documents/git/polaris-docs/content/polar/polar-token.mdx` | 746 → 745 | 1 | 1 | 1 |
| `/home/ahirice/Documents/git/polaris-docs/content/redemptions-liquidations/liquidations.mdx` | 1137 → 1136 | 1 | 1 | 1 |
| `/home/ahirice/Documents/git/polaris-docs/content/stewardship/fee-router.mdx` | 736 → 735 | 1 | 1 | 2 |
| `/home/ahirice/Documents/git/polaris-docs/content/stewardship/flows.mdx` | 966 → 965 | 1 | 1 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/resources/risk-disclosure.mdx` | 1314 → 1313 | 1 | 1 | 1 |
| `/home/ahirice/Documents/git/polaris-docs/content/changelog.mdx` | 296 → 296 | 0 | 0 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/paths/borrow-passets.mdx` | 337 → 337 | 0 | 0 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/paths/convert-lock-polar.mdx` | 357 → 357 | 0 | 0 | 1 |
| `/home/ahirice/Documents/git/polaris-docs/content/paths/earn-yield.mdx` | 372 → 372 | 0 | 0 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/paths/hold-use-peth.mdx` | 316 → 316 | 0 | 0 | 1 |
| `/home/ahirice/Documents/git/polaris-docs/content/resources/audits-security.mdx` | 448 → 448 | 0 | 1 | 0 |
| `/home/ahirice/Documents/git/polaris-docs/content/resources/brand-assets.mdx` | 428 → 428 | 0 | 0 | 0 |

## Cross-document terminology (recommendations — not auto-applied)

- **fee router (lowercase) vs Fee Router** — The canonical component is consistently "Fee Router" (capitalized) across ~20 prose uses and the /stewardship/fee-router page title. But two prose instances drop to lowercase "fee router" for the same concept: yield/yield-sources.mdx:18 ("buffered by the fee router") and peth/bonding-curve.mdx:28 ("accrues to the protocol's fee router"). These are the same proper-noun component, not generic descriptions. _Recommend:_ Capitalize both to "Fee Router" to match the rest of the corpus. (Both could also be linked to /stewardship/fee-router like every other reference, but at minimum fix the casing.)
- **interest router vs Fee Router (two distinct yield streams)** — Not a casing bug but a real reader-confusion risk worth flagging: the docs deliberately distinguish two routers - the capitalized "Fee Router" (pETH stream) and a separate lowercase "interest router" / "primary interest router" (pAsset stream, contract PrimaryInterestRouter.sol). The lowercase "interest router" appears in polar/tokenomics.mdx:41, stewardship/fee-router.mdx:32, paths/convert-lock-polar.mdx:26, and resources/glossary.mdx:29. The naming is internally consistent (capitalized = deployed Fee Router component; lowercase = the conceptual interest-split path), but the two-router distinction is explained in full only in scattered parentheticals. _Recommend:_ Keep the casing as-is (the lowercase/uppercase split is intentional and consistent), but consider stating the two-stream model canonically once (see redundancy item) and linking the lowercase "interest router" mentions to that single explanation, so readers do not mistake them for the same router or for a casing slip.
- **DMs vs direct messages** — Minor: audits-security.mdx uses "DMs" on line 26 and "direct messages" on line 35 within the same near-duplicate disclosure warning. contracts.mdx:59 also uses "DM". Same concept, two spellings on one page. _Recommend:_ Pick one form ("direct messages" reads more formal for a security-disclosure context) and use it consistently within audits-security.mdx. Low priority.

## Cross-document redundancy (recommendations — not auto-applied)

- **The two floor-raising mechanisms (swap-fee burns + conversion auctions)** (/home/ahirice/Documents/git/polaris-docs/content/peth/bonding-curve.mdx (lines 26-29), /home/ahirice/Documents/git/polaris-docs/content/peth/floor-price.mdx (lines 16-19)) — Worst cross-doc duplication. Both pages, in the same /peth section, present the identical two-bullet pair: (1) swap fees floor-sold/burned, (2) conversion auctions burn pETH - each ending "the floor rises." floor-price.mdx is the natural canonical home for "why the floor rises." Recommend bonding-curve.mdx state the floor only briefly (it owns the curve mechanism itself) and link the two-mechanisms detail to /peth/floor-price#why-it-only-rises, rather than re-listing both bullets. Do not collapse the conversion-auctions.mdx:42 reference - that one is a single sentence cross-link, appropriately tight.
- **Conversion-auction mechanics / spike-and-decay issuance model** (/home/ahirice/Documents/git/polaris-docs/content/polar/conversion-auctions.mdx (canonical), /home/ahirice/Documents/git/polaris-docs/content/polar/tokenomics.mdx (lines 14-27), /home/ahirice/Documents/git/polaris-docs/content/resources/risk-disclosure.mdx (line 65)) — The spike-and-decay self-throttling explanation is given at length in three places. conversion-auctions.mdx is clearly canonical and should stay full. tokenomics.mdx:17,26 re-derives the spike/decay/self-limiting behavior in detail and risk-disclosure.mdx:65 does it a third time. Both already link to conversion-auctions; recommend trimming the tokenomics and risk-disclosure restatements to the one-line claim + link, keeping only the locally load-bearing caveat (e.g. risk-disclosure's "not yet bounded in the prototype" point). Note: tokenomics.mdx is explicitly a consolidation page, so some overlap there is by design - trim lightly, do not gut it.
- **Redemptions applied pro-rata across all troves regardless of ICR (intra-file, flagged for completeness)** (/home/ahirice/Documents/git/polaris-docs/content/redemptions-liquidations/redemptions.mdx (stated 4x: intro callout, "How redemptions are distributed", "Who gets redeemed against", borrower callout)) — Same load-bearing safety point repeated four times within one file. This is intra-file, not cross-doc, and each instance sits in a distinct context (warning / mechanics / dedicated section / checklist), so it reads as deliberate reinforcement of a point readers commonly get wrong (many Liquity-derived designs redeem lowest-ICR-first). Recommend leaving as-is or at most lightening the 4th (borrower-callout) instance; flagging only because the editors asked for the worst repetition cases and this is the densest single-concept repetition in the corpus.

## Synthesis note

The corpus is highly consistent. Terminology: the only genuine inconsistency is lowercase "fee router" in 2 prose spots (yield-sources.mdx:18, bonding-curve.mdx:28) where every other use is the capitalized component "Fee Router" - recommend capitalizing both. The separate lowercase "interest router" is intentional and consistent (a distinct pAsset-stream router vs the pETH Fee Router), not a casing bug, but the two-router distinction lives only in scattered parentheticals and is a reader-confusion risk. One trivial DMs-vs-direct-messages variance on audits-security.mdx. All other key terms - pAsset/pAssets, pUSD/pETH/pGOLD/pCHF, POLAR, vePOLAR, Stability Pool, bonding curve, trove (with "never vault" actively enforced), CDP, conversion auction, floor price, Recovery Mode/Emergency Mode, TCR/Total Collateralization Ratio, StablecoinOS, PolarEX, Flow(s) - are uniform in spelling and casing. The lineage facts (SAI 2017, LUSD 2021, BOLD/Liquity V2 2024, pUSD 2026; "~20% of its life >1% above peg") match across why-polaris, the explainers, and faq. The synthetic/pegged framing is consistent. Redundancy: the worst cross-doc case is the "two floor-raising mechanisms" bullet pair duplicated near-verbatim on bonding-curve.mdx and floor-price.mdx (same section); next is the spike-and-decay issuance model explained at length on conversion-auctions, tokenomics, and risk-disclosure. The 4x repetition of the redemption-pro-rata point is intra-file and looks like deliberate safety reinforcement.

---
*Generated by the `polaris-content-tighten` workflow: a per-file propose→verify→apply pipeline plus a cross-doc synthesis pass.*
