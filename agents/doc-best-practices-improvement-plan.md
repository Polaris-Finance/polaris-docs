# Polaris Docs — Best-Practices Improvement Plan

**Date:** 2026-06-08
**Scope:** `polaris-docs` (Nextra v4 + Next.js 16, GitHub Pages → `docs.polarisfinance.io`)
**Method:** Three parallel research subagents — (1) general documentation best practices, (2) competitive analysis of CDP/stablecoin protocol docs (Liquity v1/v2, Sky/Maker, crvUSD, +Aave/GHO/Frax/RAI), (3) audit of the current `polaris-docs` repo. This document consolidates and prioritizes their findings.

---

## 0. TL;DR

The Polaris docs are **already in the top tier** of CDP protocol documentation: clean audience-based IA, worked numeric examples, a 10-category Risk Disclosure page, glossary, FAQ, honest "what this does NOT do" framing, and strong CI tooling. Most of the textbook advice ("add a risk page," "add a glossary," "use worked examples") is **already done**.

So this is **not a rewrite plan**. It is a **surgical upgrade plan** targeting the gap between "excellent pre-launch prose" and "best-in-class launched CDP docs." The highest-leverage moves, in order:

1. **Move risk warnings to the point-of-decision** (the #1 anti-pattern every competitor shares — even Liquity v2).
2. **Adopt the Maker "Gotchas / Failure Modes" template** in `developers/`.
3. **Close the universal DX gap** — SDK snippet + subgraph + copy-paste integration examples — the one thing *none* of Liquity/Maker-user/crvUSD ship well.
4. **Exploit Nextra components already installed** (`<Steps>`, `<Tabs>`, `<Callout>`, `<FileTree>`) — currently only `<Cards>` is used.
5. **Use the two unused infographics** and add explicit audience signposting.
6. **Launch-fill the placeholders** (addresses, ABIs, audits, parameters) with anti-phishing-grade presentation.

---

## 1. What Polaris already does well (do not regress these)

The audit confirms these strengths — every recommendation below must preserve them:

- **Audience-based IA with separators** (`Using Polaris` / `Reference`), every page registered in nav, no orphans.
- **Concept→how-to pairing** (e.g. Stability Pool ↔ Deposit to the Stability Pool), a one-page Core Concepts map, alphabetized Glossary, ~20-item FAQ.
- **Risk Disclosure page** with 10 categories, each paired with a mitigation — this already matches the Liquity v2 gold-standard structure (see §3.1, which is about *placement*, not creation).
- **Worked numeric examples** throughout (ICR, interest accrual, Stability Pool P&L, redemption impact, liquidation, Recovery Mode/TCR) — the Liquity v1 strength.
- **Disciplined pre-launch honesty** — `forthcoming`/`TBA` placeholders instead of invented data, enforced by `scripts/check-content.mjs`.
- **Robust engineering** — content linter, internal+external link checker, Pagefind smoke test, sitemap generation, Dependabot, dual CI/deploy workflows; documented load-bearing build constraints (`--webpack`, `zod` pin).
- **Complete SEO/metadata foundation** — per-page canonical + OG `article` + Twitter, `metadataBase`, sitemap, robots, `.nojekyll`, CNAME, branded 404.

---

## 2. Benchmark — what the best CDP docs do

Synthesized from the documentation-best-practices and competitive-analysis agents. Each row is a practice with the exemplar that does it best.

| Practice | Exemplar | Polaris status |
|---|---|---|
| Diátaxis separation (concept vs task vs reference) | Diátaxis / Cloudflare | **Partial** — pairing exists; some pages still mix |
| Consolidated Risk Disclosure w/ per-risk mitigation + blunt worst-case | **Liquity v2** | ✅ have page · ⚠️ missing point-of-decision callouts |
| Risk callout *at the point of decision* | (nobody does this well) | ❌ **opportunity** |
| Per-module "Gotchas / Failure Modes" template | **Maker/Sky** Vat docs | ❌ missing in `developers/` |
| Worked numeric examples | **Liquity v1** | ✅ strong |
| User-legible threshold framing (LTV vs MCR) | **Liquity v2** | ⚠️ verify consistency with app UI |
| Peg as floor + ceiling + soft-peg | **Liquity v1** | ⚠️ verify explicitness |
| Two-audience split w/ explicit signpost, one domain | **crvUSD** | ⚠️ have paths; no signpost |
| Verified address tables → block-explorer links (anti-phishing) | Liquity v2 / Sky Chainlog | ❌ skeleton only (pre-launch) |
| Version matrices + changelog for integrators | **crvUSD** | ❌ missing |
| SDK + subgraph + copy-paste integration examples | **Aave/GHO** (the gap for everyone else) | ❌ **differentiation opportunity** |
| Audits grouped by component + bug bounty | Liquity v2 / Sky | ⚠️ structure exists, content forthcoming |
| Machine-readable export (`llms.txt`, per-page `.md`) | **Liquity** (GitBook) | ❌ missing |
| Worst-case-blast-radius mechanism explained | **Aave/GHO** bucket caps | ⚠️ check caps/isolation framing |
| Nextra built-ins (Steps/Tabs/Callout/Cards/FileTree) | Nextra | ⚠️ only `<Cards>` used |
| WCAG 2.2 AA contrast/focus in both themes | W3C | ❓ unaudited (dark-mode-canonical) |
| Keep a Changelog (incl. Security) | keepachangelog.com | ❌ missing |

---

## 3. Prioritized improvements

Priority key: **P0** launch-blocking · **P1** high-impact structural · **P2** content/discoverability · **P3** polish.

### P0 — Launch fill-ins (fill placeholders with best-practice presentation)

These pages are correctly scaffolded with `TBA`/`forthcoming` and must be filled at launch. The improvement is *how* they're filled, not just that they are.

- **`resources/contracts.mdx` + `developers/contract-reference.mdx`** — when addresses land:
  - One table per network; **every address hyperlinked to the verified contract on the block explorer**. Address-spoofing is a live attack vector — the explorer link is the anti-phishing control (Liquity v2 pattern). Reinforce with the existing phishing-warning posture.
  - Add a **version matrix + changelog** for any versioned contract (crvUSD pattern): which version each market/trove type runs, source commit, compiler version. State explicitly which interfaces are stable vs versioned.
  - Consider a **Chainlog-style canonical registry** link if an on-chain registry exists (Sky pattern) — superior to static tables for integrators.
- **`resources/audits-security.mdx`** — when audits land: group reports **by component** (Core / Stewardship / Conversion / Redemption) and by date; name every firm; one-line scope + commit hash per report; link PDFs; link the **bug-bounty** intake (Immunefi/Cantina-style) with disclosure process.
- **Final numeric parameters** (min ICR, Recovery Mode trigger, liquidation penalty, fee formulas, β, Fee Router splits, conversion bounds) — replace every "pending final values" table. Highest placeholder density: `stewardship.mdx` (17), `flows.mdx` (12), `vepolar.mdx` (12).

### P1 — High-impact structural

1. **Risk callouts at the point of decision** *(the single biggest differentiator)*
   Every competitor — including risk-disclosure-leader Liquity v2 — scatters or buries the warning that matters most at the moment of action. Add a focused `<Callout type="warning">` **on the action page itself**, linking to the full Risk Disclosure:
   - `minting/open-a-trove.mdx` → liquidation risk if ICR falls; Recovery Mode consequences.
   - `redemptions-liquidations/redemptions.mdx` → for trove owners: you can be redeemed against while solvent, losing pETH exposure (the "redemption sting" Liquity under-states).
   - `yield/deposit-to-stability-pool.mdx` → deposit can be converted to collateral during liquidations; principal at risk.
   - `polar/participate-in-conversion.mdx` → conversion/auction risk.
   *Rule:* reserve `WARNING`/`CAUTION` for genuine financial-loss risk so they don't get tuned out.

2. **Adopt the Maker per-module template in `developers/`**
   Restructure `developers/architecture.mdx` + `contract-reference.mdx` per component as:
   **Summary → Glossary/Contract Details → Mechanisms → Gotchas → Failure Modes.**
   The "Gotchas / Failure Modes" headings force documentation of the footguns integrators actually hit (oracle staleness, adapter faults, governance/upgrade authority, rounding) — the most copyable structural idea from Sky/Maker.

3. **Close the DX gap — Polaris's clearest differentiation**
   None of Liquity / Maker-user-docs / crvUSD ship polished integration DX. Add to `developers/integration-guide.mdx`:
   - A **minimal TypeScript snippet** (viem/ethers) that connects and reads trove health/ICR — the dev "hello world," in `<Tabs>` (TS / cURL / Python), complete with imports, placeholders, and error handling (not happy-path only).
   - A **published subgraph endpoint** + 2–3 example queries (open position, read health, simulate redemption).
   - If/when an SDK exists, document install + the three highest-value calls.

4. **Explicit two-audience signposting (crvUSD pattern)**
   Add a one-line signpost on the Developers landing and the user-facing Resources/Getting-Started: *"Building on Polaris? See Developers. Just using Polaris? Start with Getting Started."* Keep everything on the single `docs.polarisfinance.io` domain (avoid Maker's six-domain fragmentation and Curve's `.fi`/`.finance` link-rot).

5. **Resolve `paths/` redundancy**
   The 6 router pages (240–271 words) largely duplicate the index `<Cards>` and Getting Started's "Choose your path." Either (a) consolidate into one richer "Choose your path" page with role-specific depth, or (b) enrich each with genuinely role-specific sequencing (what to read, in what order, with prerequisites). Don't keep them as thin link-lists.

### P2 — Content & discoverability

6. **Exploit installed Nextra components** (only `<Cards>` is used today):
   - `<Steps>` on every procedural page (`open-a-trove`, `deposit-to-stability-pool`, `participate-in-conversion`, `managing-your-trove`).
   - `<Callout>` for notes/warnings (currently `> **Note:**` blockquotes — flatter; migrate if the content linter's GitHub-admonition ban is updated to allow the JSX component form).
   - `<Tabs>` for multi-language code (see DX gap above).
   - `<FileTree>` in `developers/` to show SDK/repo layout.
   - `<Table>` for address/parameter reference (replacing plain markdown tables where sortable structure helps).
7. **Use the two orphaned infographics** (referenced nowhere): `public/polaris-system-v2.svg` → natural fit for `core-concepts.mdx`/`developers/architecture.mdx`; `public/infographics/polaris-lineage.svg` → `why-polaris.mdx`. Caption + alt-text + a numbered text description for each (accessibility + meaning-survives-without-image). Overall visual density is low — only 3 inline images across 39 pages.
8. **Add the missing pages** the audit flagged: a **changelog / "what's new"** (Keep a Changelog format, include a Security category; the `changelog-collect` skill can bootstrap from git), an **economics/tokenomics** page (POLAR distribution, the 8.2% Polar Council allocation currently only in the glossary, vesting), a **PolarEX** page (referenced as a yield source + glossary term but has no page), and a **roadmap/launch-timeline** page.
9. **Worst-case blast-radius framing (Aave/GHO):** if Polaris has minting caps, isolated troves, or per-collateral limits, explain them explicitly as "this is what bounds the damage if X fails."
10. **Machine-readable export (Liquity pattern):** generate an `llms.txt` / `llms-full.txt` and ensure per-page content is fetchable, so integrators and agents can consume the docs programmatically. Cheap; increasingly expected.
11. **External-DeFi usage examples:** expand beyond the single Aave/Morpho/Euler mention in `bonding-curve.mdx` — show pAssets used as collateral/LP elsewhere.

### P3 — SEO / metadata / a11y polish

12. **Trim long meta descriptions** to ≤~160 chars (`recovery-mode` 235, `liquidations` 221, `redemptions` 209 — risk SERP truncation).
13. **Add an OG image** (raster). Twitter card is `summary` with no image; `polaris-system-v2.svg` rasterized (or a dedicated card) improves link previews. The `svg-to-png` skill handles SVG→PNG with fonts/filters.
14. **WCAG 2.2 AA audit of the dark-canonical theme:** verify 4.5:1 text / 3:1 UI-and-focus contrast for the "Celestial Night Sky" palette, desaturated accents, distinguishable links, visible non-obscured focus (sticky header), skip-to-content link, and that meaning is never color-only (status badges/callouts pair color with icon/label). The `accessibility` skill can drive this.
15. **Re-enable trust built-ins after the repo is public:** `projectLink`, `docsRepositoryBase`, `editLink`, and `feedback` (currently `null` in `app/layout.jsx` by design pre-launch) — gives "edit this page," "last updated" git stamps, and a feedback loop. Document a one-line docs-PR contribution flow.

---

## 4. Suggested sequencing

```
Phase A — Pre-launch, do now (no launch data needed):
  P1.1 point-of-decision risk callouts      → verify: callout on each action page, links to Risk Disclosure
  P1.2 Gotchas/Failure-Modes template        → verify: developers/ pages restructured
  P1.4 audience signposting                  → verify: signpost on Developers + Getting Started
  P1.5 paths/ consolidation                  → verify: no thin duplicate router pages
  P2.6 Nextra components (Steps/Tabs/FileTree)→ verify: <Steps> on all procedural pages
  P2.7 use 2 orphaned infographics           → verify: 0 unreferenced infographics
  P2.8 changelog + tokenomics + PolarEX pages → verify: pages exist, registered in _meta
  P2.10 llms.txt export                       → verify: /llms.txt builds
  P3.12 trim meta descriptions                → verify: all ≤160 chars (extend check-content.mjs)
  P3.13 OG image                              → verify: og:image in metadata
  P3.14 WCAG 2.2 AA audit                      → verify: contrast/focus pass both themes

Phase B — At launch (data-gated):
  P0 contracts/ABIs/audits/params w/ explorer links + version matrix + bug bounty
  P1.3 SDK snippet + subgraph + integration examples
  P3.15 re-enable editLink/feedback/projectLink once repo is public
```

Each Phase-A item is independent and PR-sized. Recommend starting with **P1.1 (risk callouts)** — highest user-protection value, lowest effort, and it's the one thing the entire competitive set gets wrong.

---

## 5. Anti-patterns to avoid (observed in competitors)

- **Scattering risk across feature pages** instead of at the decision point (all of Liquity, crvUSD).
- **Brand/domain fragmentation** (Maker→Sky across six domains) — stay on one domain with redirects.
- **Under-selling the downside of a "safer" mechanism** (crvUSD soft-liq, Liquity redemptions) — state the cost as clearly as the benefit.
- **Reference-only docs with no conceptual onramp** (Sky/Maker for users) — keep the borrower narrative ahead of contract internals.
- **Static address lists with no versioning** (Liquity v2) — ship a changelog/version matrix.
- **Over-using callouts** until they're ignored — reserve WARNING/CAUTION for real loss risk.

---

## 6. Sources

**Best-practices:** Diátaxis (diataxis.fr) · Google Developer Documentation Style Guide · Algolia DocSearch · W3C WCAG 2.2 · Nextra docs (built-ins, `_meta`, Pagefind search) · Keep a Changelog · Stripe/Twilio/Supabase/Aave exemplar docs.

**Competitive analysis:**
- Liquity v1 — docs.liquity.org/liquity-v1 (general/SP-liquidations/redemptions/recovery-mode FAQs)
- Liquity v2 — docs.liquity.org (general, borrowing-and-liquidations, redemptions-and-delegation, **risk-disclosure**, technical-docs-and-audits)
- Sky/Maker — developers.skyeco.com (CDP Manager, security overview, Chainlog) · docs.makerdao.com Vat detailed docs (legacy gold standard)
- crvUSD — resources.curve.finance (loan concepts, glossary) · docs.curve.finance/developer/crvusd (Controller, LLAMMA, deployments, version matrices)
- Adjacent — aave.com/docs (GHO facilitators/bucket caps) · docs.frax.finance · docs.reflexer.finance

**Repo audit:** `polaris-docs` @ branch `master` — 39 `.mdx` pages, 10 `_meta.js`, Nextra ^4.6.1 / Next ^16.2.7, Pagefind search, GitHub Pages → docs.polarisfinance.io.

---
*Generated by a 3-subagent research orchestration (docs-bp · cdp-docs · polaris-audit), consolidated 2026-06-08.*
