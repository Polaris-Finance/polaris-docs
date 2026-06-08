# Polaris Docs Vision: Full Application Surface, Minimum Words

## Purpose

This report describes what the Polaris documentation should become if its primary goal is to cover the full application surface with the fewest useful words, no repeated explanations, and maximum clarity.

The target is not "more docs." The target is a documentation system where every user action, protocol concept, and reference fact has exactly one natural home.

## Research basis

This report is based on:

- A local map of the current Nextra/Next docs app, navigation, generated routes, scripts, and authored MDX files.
- A subagent pass focused on the application, protocol, API, config, and integration surface.
- A subagent pass focused on information architecture, repeated topics, thin pages, stale signals, and missing sections.

No existing source or documentation files were changed for this report.

## Executive thesis

Polaris docs should be organized around the application surface first, then the protocol model behind it, then canonical reference facts.

The current docs are broad and often well written, but they spend too many words re-explaining status, testnet caveats, pending parameters, POLAR/vePOLAR distinctions, yield routing, and pETH basics. At the same time, the actual app-tab surface under `content/using-app/` is thin.

The efficient future state is:

- App task pages tell users what to do, what to check, what can fail, and where to go next.
- Concept pages explain one concept once and link forward to tasks.
- Reference pages own facts that change, such as launch state, parameters, contracts, artifacts, and security status.
- Developer pages cover integration surfaces directly instead of making integrators infer behavior from user docs.
- Every repeated warning becomes either a one-line local reminder or a link to the canonical source.

## Current shape

The current authored content is about 38 MDX pages under `content/`.

Strong coverage:

- pETH, bonding curve, floor price, and split mechanics.
- Troves, collateralization, redemptions, liquidations, and recovery mode.
- Stability Pool, yield sources, POLAR, conversion, stewardship, Fee Router, and Flows.
- Testnet contracts, risk disclosure, safety checks, FAQ, glossary, and brand assets.

Weak coverage:

- Full app-tab workflows: Dashboard, Swap, Borrow, Earn, Split, Zap, Advanced.
- Troubleshooting for failed or confusing app actions.
- Developer and integrator docs: architecture, ABI/event reference, read helpers, indexing, manifests, integration recipes.
- Canonical parameter reference.
- Clear separation between environment status, testnet artifacts, contract addresses, and production readiness.

Main repetition:

- Launch/testnet/production status appears across launch status, testnet, contracts, safety, risk, and FAQ pages.
- Pending parameter status appears across minting, redemptions, liquidations, recovery mode, and yield pages.
- Yield routing is split across Stability Pool, yield sources, POLAR tokenomics, and Fee Router pages.
- POLAR staking vs vePOLAR appears across POLAR, tokenomics, vePOLAR, and app earn docs.
- pETH basics recur in pETH, minting, split, floor, and conversion contexts.

Main stale signals:

- Internal product notes mention Public Testnet 2 while current authored docs say Public Testnet 1.
- Existing agent reports mention old page counts.
- Search boosts in `app/[[...mdxPath]]/page.jsx` reference stale route patterns.
- `/resources` is labeled as a section, but the landing page is actually the glossary.

## Documentation contract

Every page should satisfy one of four contracts.

### 1. Task guide

Use for app actions.

Required sections:

- What this action does.
- Before you start.
- Steps.
- How to know it worked.
- Common failures.
- Risks and links.
- Next actions.

Target length: 500 to 800 words.

### 2. Concept explainer

Use for protocol ideas.

Required sections:

- Definition.
- Why it matters.
- How it works.
- What users feel in the app.
- Risks or limits.
- Related tasks.

Target length: 600 to 900 words.

### 3. Reference page

Use for facts that can change or must be exact.

Required sections:

- Scope.
- Canonical data table or list.
- Source and freshness rule.
- How to verify.
- Related pages.

Target length: as short as possible. Tables are preferred over repeated prose.

### 4. Troubleshooting page

Use for problems users search for.

Required sections:

- Symptom.
- Likely cause.
- Fix.
- When not to proceed.
- Related reference.

Target length: 700 to 1,200 words for the page, with short entries.

## Single-source ownership rules

These rules remove repetition.

- `Launch Status` owns what is live, not live, deprecated, or unsafe.
- `Public Testnet 1` owns testnet artifacts and manifest links.
- `Contracts & Addresses` owns addresses and verification links.
- `Parameters` owns numeric values, pending values, source, network, and finality status.
- `Risk Disclosure` owns risk explanations.
- `Safety & Verification` owns user-facing safety checks.
- `Glossary` owns terminology.
- `Audits & Security` owns audit status, disclosure intake, safe harbor, and bounty scope.
- `Changelog` owns docs-site changes only unless explicitly renamed to product release notes.
- App task pages may mention status, risk, or parameters only as one-line reminders with links to canonical pages.

## Proposed information architecture

### Start Here

- `Introduction`: one-screen mental model and decision tree.
- `Launch Status`: current network, frontend, production state, and what not to use.
- `Public Testnet Quickstart`: fastest safe path from wallet to first meaningful action.
- `Safety & Verification`: frontend, network, contract, and wallet checks.

Purpose: get a user safely oriented in under five minutes.

### Use the App

- `Dashboard & Analytics`: what each metric means and when it should change behavior.
- `Swap`: WETH/pETH and pAsset swaps, quote checks, slippage, failed swaps.
- `Borrow`: open a trove, choose pAsset, choose debt, understand ICR before signing.
- `Manage Trove`: add collateral, mint more, repay, close, monitor liquidation exposure.
- `Earn`: deposit into Stability Pool, claim gains, understand first-loss risk.
- `Split`: split/merge pETH into fpETH/vpETH and understand redemption behavior.
- `Zap`: one-transaction routes, approvals, fallback paths, failure modes.
- `Advanced`: approvals, PSM actions, reserve loans, POLAR staking, conversion, manual checks.
- `Troubleshooting`: network mismatch, faucet shortage, failed approvals, stale quotes, gas, wrong frontend, missing balances.

Purpose: cover the full app surface with action-oriented pages.

### Understand the System

- `Why Polaris`: positioning and design tradeoffs.
- `Core Concepts`: map of pETH, pAssets, troves, Stability Pool, POLAR, stewardship.
- `pETH`: bonding curve, floor, reserve use, and app implications.
- `pAssets and Troves`: borrower model and collateralized debt position basics.
- `Peg Mechanics`: redemption, arbitrage, and why peg pressure affects borrowers.
- `Liquidations and Recovery Mode`: system safety mechanics and user impact.
- `Yield`: Stability Pool, fee sources, routing, and first-loss mechanics.
- `POLAR and Stewardship`: POLAR, staking, vePOLAR, conversion, and what stewardship can control.

Purpose: explain the protocol once, in the order users encounter it.

### Protocol Mechanics

- `Open and Manage Troves`: detailed borrower mechanics.
- `Redemptions`: formulas, ordering, borrower effects, MEV notes.
- `Liquidations`: liquidation path, collateral and debt movement, examples.
- `Recovery Mode`: TCR, restrictions, and borrower safety.
- `Stability Pool`: deposits, offsets, rewards, withdrawal behavior.
- `Conversion Auctions`: pETH burn, spike-and-decay pricing, POLAR output.
- `Fee Router and Flows`: revenue collection, buffers, distributions, Flow lifecycle.

Purpose: keep deeper mechanics available without bloating app task pages.

### Reference

- `Glossary`: terms only.
- `Parameters`: canonical matrix by network, pAsset, source, status, and last reviewed date.
- `Contracts & Addresses`: canonical addresses, verification links, and deployment model.
- `Public Testnet 1 Artifacts`: manifest paths, chain ID, test assets, deploy metadata.
- `Risk Disclosure`: complete risk taxonomy.
- `Audits & Security`: audits, disclosure, safe harbor, bounty scope.
- `FAQ`: short answers only, with links to canonical pages.
- `Brand Assets`: logos, palette, typography.
- `Changelog`: docs changes, or split into docs changelog and product release notes.

Purpose: provide exact facts without burying them inside narrative pages.

### Developers

- `Architecture`: contracts, state model, dependencies, and invariants.
- `Contract Reference`: core contracts, per-pAsset contracts, key methods, and permissions.
- `Events and Indexing`: event catalog, suggested entities, reorg handling, and derived metrics.
- `Read Helpers`: getter usage, examples, expected return shapes.
- `Integration Recipes`: quote, borrow, repay, deposit, claim, split, convert, and verify flows.
- `Deployment and Manifests`: source of truth, manifest freshness, chain IDs, and fail-closed rules.

Purpose: stop making integrators reverse-engineer app behavior from user prose.

## Full application surface coverage matrix

| App surface | Canonical owner | Must cover | Must not repeat |
| --- | --- | --- | --- |
| Dashboard / Analytics | `Use the App / Dashboard & Analytics` | Metrics, health signals, links to related actions | Full protocol definitions |
| Swap | `Use the App / Swap` | Supported swaps, quote checks, slippage, stale quotes, failed txs | pETH bonding curve basics beyond one sentence |
| Borrow | `Use the App / Borrow` | Open trove flow, pAsset choice, collateral, debt, ICR, confirmation checks | Full redemption/liquidation mechanics |
| Manage Trove | `Use the App / Manage Trove` | Add collateral, mint, repay, close, monitor, liquidation price | Full parameter tables |
| Earn | `Use the App / Earn` | Stability Pool deposit/withdraw/claim, first-loss, rewards | Full yield-routing architecture |
| Split | `Use the App / Split` | Split, merge, fpETH, vpETH, redemption expectations | Full pETH floor explanation |
| Zap | `Use the App / Zap` | Route intent, approvals, failure modes, fallback manual path | Full swap and earn guides |
| Advanced | `Use the App / Advanced` | PSM, reserve loans, conversion, POLAR staking, approvals, manual verification | General safety essay |
| Wallet / Network | `Start Here / Public Testnet Quickstart` and `Troubleshooting` | Sepolia setup, faucet, test WETH, app URL, chain mismatch | Contract tables |
| Safety | `Start Here / Safety & Verification` | Correct frontend, addresses, signatures, phishing checks | Full risk disclosure |
| Parameters | `Reference / Parameters` | Numeric values, pending values, source, finality | Repeated pending-status blocks |
| Contracts | `Reference / Contracts & Addresses` | Addresses, verification, deployment shape | Testnet quickstart prose |
| Developer integration | `Developers/*` | Architecture, ABIs/events, read helpers, recipes, manifests | User-facing onboarding |

## Word-wise efficiency rules

Use these rules as editorial constraints.

- One concept gets one definition. Other pages link to it.
- One warning gets one canonical page. Task pages use short warning labels.
- One parameter gets one table row. Narrative pages name the parameter but do not restate its value.
- One workflow gets one task page. Related concept pages link to the task.
- Every page starts with the answer, not the background.
- Every page ends with next actions, not a recap.
- No page should explain "what is Polaris" except Introduction, Why Polaris, and Core Concepts.
- FAQ answers should be two to five sentences and link out.
- Glossary entries should not become mini-guides.
- Generated artifacts and stale export folders should not be treated as authored documentation.

## Recommended consolidation decisions

### Keep separate

- `Redemptions`, `Liquidations`, and `Recovery Mode`: these are distinct risk mechanics and should remain separate.
- `pETH`, `pETH Floor Price`, and `pETH Split`: these map to different user questions and app actions.
- `Risk Disclosure` and `Safety & Verification`: risk explains exposure; safety tells users how not to get phished or misdirected.
- `Contracts & Addresses` and `Public Testnet 1 Artifacts`: one is address verification; the other is environment artifact source.

### Merge or rewrite

- Merge repeated launch/testnet caveats into `Launch Status`.
- Move repeated pending-parameter notes into a new `Parameters` page.
- Move scattered yield-routing explanations into one canonical `Yield` or `Fee Router and Flows` explanation, then link to it.
- Combine broad POLAR overview and tokenomics where possible, unless tokenomics becomes a true parameter/reference page.
- Turn `content/resources/index.mdx` into a real Resources landing page or move glossary to `content/resources/glossary.mdx`.
- Either expand each `content/using-app/*` page into a proper task guide or consolidate thin tab summaries into one `App Surface` page. For full application coverage, expansion is the better choice.

## Suggested page budget

The goal is not the lowest page count. The goal is the lowest repetition count.

Suggested target:

- 4 Start Here pages.
- 9 Use the App pages.
- 8 Understand the System pages.
- 7 Protocol Mechanics pages.
- 9 Reference pages.
- 6 Developer pages.

That is about 43 pages, but with clearer ownership. The current 38 pages are missing important app and developer coverage, so a small page-count increase is acceptable if repeated prose is removed.

Suggested word budget:

- Task pages: 500 to 800 words each.
- Concept pages: 600 to 900 words each.
- Reference pages: table-first and as short as practical.
- Troubleshooting: compact symptom/fix entries.
- Total target: roughly 28,000 to 34,000 authored words after adding missing app/developer coverage and deleting repeated caveats.

## Migration order

1. Create canonical `Parameters`, `Troubleshooting`, and `Developers` section stubs.
2. Make `Launch Status` the only environment-status owner.
3. Make `Public Testnet 1` the only testnet artifact owner.
4. Make `Contracts & Addresses` the only address owner.
5. Expand the app-tab pages using the task-guide contract.
6. Remove repeated pending-parameter sections from task and mechanics pages.
7. Normalize POLAR, vePOLAR, yield-routing, and pETH explanations so each has one canonical owner.
8. Fix stale search boost routes and stale internal planning docs.
9. Add a content lint rule or review checklist for forbidden duplicate facts.
10. Rebuild generated artifacts only after authored pages and navigation settle.

## Definition of done

The documentation has reached the target state when:

- Every visible app tab has a task page with prerequisites, steps, success checks, failures, risks, and next actions.
- Every mutable fact has one canonical owner page.
- No page says it is the source of truth for a topic owned by another page.
- No task page repeats full launch, parameter, contract, or risk explanations.
- Developers can find architecture, manifests, contract surfaces, event/indexing guidance, and integration recipes without reading user guides.
- Search results use current route names and terminology.
- FAQ, glossary, and changelog are clearly scoped.
- A new user can safely complete the testnet quickstart without reading protocol mechanics.
- A borrower can understand liquidation and redemption exposure without reading unrelated POLAR or stewardship material.
- An integrator can fail closed when manifests, addresses, or production deployment status are missing.

## Bottom line

The best version of these docs is an operating manual for the app, backed by a concise protocol model and strict reference ownership.

The current docs should not be cut indiscriminately. They should be reorganized so the words already spent on protocol knowledge stop being repeated, and the missing words go only where they cover real app or integration surface.
