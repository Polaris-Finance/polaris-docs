# Using the App — Enhancement Review

Date: June 9, 2026

**Scope:** the eight pages under `content/using-app/` (Dashboard & Analytics, Swap, Borrow, Manage Trove, Earn, Split, Zap, Advanced). Goal per request: each page clear and comprehensive, matching the **reality of the live testnet app**, concise and precise.

**Source of truth:** the deployed app at `https://app.testnet.polarisfinance.io/` — version banner `Alpha · Sepolia · 68e4596` — explored tab by tab on June 9, 2026, plus the four connected-state screenshots already in `public/screenshots/` (dashboard, swap, borrow, earn, split, zap), the in-app **Guide** tab, and the Sepolia deployment manifests in `/home/ahirice/Documents/git/polaris`.

> ⚠️ **Do not review these pages against `/home/ahirice/Documents/git/polaris/frontend/proto`.** That directory is a separate low-level "Protocol Workbench" dev tool (single scrolling page, no tabs, pUSD-only `// XXX dirty hack`, no Swap/Zap/Split labels). The **deployed** app is a different, newer, tabbed product (commit `68e4596`) whose source is not in that checkout. An early code-only pass concluded "Swap/Zap/Split don't exist" and "the app shows no APR" — both **false** for the live app. Always verify against the live URL.

---

## Executive summary

The section is **structurally sound**: the tab set in `_meta.js` matches the live left-nav, and the referenced screenshots are genuine captures of the live app. The problem is **prose, not architecture**. Three patterns recur on every page:

1. **Defensive hedging instead of fact.** "where available", "where exposed", "if the app offers it", "protocol modules exposed by the current deployment", "may also include". The live app is concrete and stable enough to describe concretely. The hedging makes the pages read as guesses and buries the actual steps.
2. **A handful of real inaccuracies** — each fixable in one edit: see [Cross-cutting corrections](#cross-cutting-corrections).
3. **Under-coverage of what the app actually shows** — sub-tabs, APR figures, the LTV slider + "Projected position" panel, the Split 1:1:1 / no-fee / reversible framing, the Activity panel, the on-Dashboard faucet, and the in-app Guide are all real, useful, and mostly unmentioned.

Two **structural** fixes are worth a decision before line-editing:

- **`manage-trove.mdx` documents a tab that does not exist.** The live app has **no "Manage Trove" tab**. Borrow is one tab that both opens *and* manages positions (existing positions render inline when connected). Recommendation: fold "manage" into `borrow.mdx` and drop the standalone page, or keep the page but retitle it and stop implying it is a separate destination. See [Borrow](#3-borrowmdx) / [Manage Trove](#4-manage-trovemdx).
- **"Dashboard & Analytics" conflates two separate nav items.** In the app, **Dashboard** is a tab and **Analytics** is a separate external-link item (opens in a new tab). The index page should be **Dashboard**, with Analytics as a short pointer, not a co-equal half of the page. See [Dashboard](#1-indexmdx--dashboard).

Net: this is a **tighten-and-correct** pass, not a rewrite. Most pages lose words and gain accuracy.

---

## Ground truth: the live app (reference map)

**Left nav (PROTOCOL group):** Dashboard · Swap · Borrow · Earn · Split · Zap · Guide — then a divider — **Advanced** · **Analytics** (external ↗). Top-right: **Connect Wallet** + an Activity (clock) icon. Persistent banner: *"Welcome to the Polaris testnet beta. This is not the final UI, but the first version for external testing."* Bottom price ticker: pETH, pUSD, pGOLD, POLAR (live USD prices).

**Token model (confirmed from the Swap, Split, Guide, and Advanced tabs):**

```
sepETH ──faucet (pay 0.1 sepETH → 10 WETH)──▶ WETH
WETH ──Swap / bonding curve──▶ pETH                 (pETH = ETH-correlated collateral, hard rising floor)
pETH ──Split (1:1:1, no fee, no oracle, reversible)──▶ fpETH + vpETH
        fpETH = floor leg (only ever rises in ETH)
        vpETH = above-floor volatility leg
pETH ──Borrow (CDP)──▶ pUSD  or  pGOLD              (overcollateralized stablecoins)
fpETH ──Borrow (reserve loan)──▶ ETH                (100% LTV, no liquidation risk)
pETH ──Advanced: convert (one-way auction)──▶ POLAR (burns pETH, raises floor)
```

**Per-tab reality:**

| Tab | What it actually is | Key facts the docs must reflect |
|---|---|---|
| **Dashboard** (`/`) | "Your Polaris" overview + onboarding | 3 APR summary cards (pUSD SP, pGOLD SP, POLAR Staking); 3-step onboarding (Connect → **Get WETH faucet** → Earn pUSD); an fpETH "Long-term ETH yield" card (~34% APR); price ticker; **Activity** panel (local, session-only). Not a balance/positions table. |
| **Swap** (`/swap`) | The **bonding curve** (Sell ETH ⇄ Buy pETH) | Route shown literally: `WETH → BONDING CURVE → pETH`. Sell/Buy toggle. Rich "What is pETH?" explainer inline. It is **not** a general DEX/router across arbitrary assets. |
| **Borrow** (`/borrow`) | Open **and** manage positions | Sub-tabs **pUSD · pGOLD · ETH**. Collateral (pETH for pUSD/pGOLD; fpETH for ETH) + **LTV slider** (25/50/75% presets) + "Your effective rate" (can be **negative**) + Debt + **Projected position** (Liquidation at $, Est. monthly cost, LTV) + Approve→Open. Wallet-gated: *"Connect a wallet to view and manage your loans."* |
| **Earn** (`/earn`) | Stability pools + staking | Sub-tabs **pUSD · pGOLD · POLAR · vpETH**. Each shows **APR**, Deposit/Withdraw (or Stake/Unstake), "Also claim pending …" checkbox. pUSD SP line: *"Earns pUSD interest + pETH liquidation gains."* Gated: *"supply a stability pool or stake POLAR."* |
| **Split** (`/split`) | pETH ⇄ fpETH+vpETH | Split/Merge toggle. **1 pETH = 1 fpETH + 1 vpETH; no fees, no oracle, fully reversible.** Live floor/market readout + a "What if…" price simulator. Renders without a wallet. |
| **Zap** (`/zap`) | Bundled strategies | "Zap into a Position." Strategy cards incl. **pUSD Stable Yield** (WETH → market-buy pUSD → deposit in pUSD SP, one tx) and **Floor Carry** (ETH → fpETH → borrow ETH, loopable). Notes self-custody, slippage bound, pre-sign simulation, exit via Earn. |
| **Advanced** (`/advanced`) | "Expert operations… for arbitrageurs and keepers" | **PSM** Mint/Redeem pUSD **and pGOLD** (pETH ⇄ pAsset at oracle price, permissionless, unlimited); **Convert pETH → POLAR** (one-way auction, spike-and-decay, burns pETH); **Testnet ETH Faucet** (0.1 sepETH → 10 WETH, 1 claim / 4h, ~1,200/day cap). No "manual approvals / reserve-loan / staking" panels — those live in Borrow/Earn. |
| **Guide** (`/guide`) | "What to do on Polaris?" strategy catalog | Authoritative, by-token use cases with risk labels + recommended actions and routes. The docs section currently **never references it**; it should. |
| **Analytics** (↗) | Separate external dashboard | Opens in a new tab. Contents unverified in this pass — see [open items](#open-items-verify-with-a-connected-wallet). |

**Protocol constants (from manifests, for accuracy in copy):** MCR `1.15` (115%); Emergency-mode MCR `1.50`, emergency ratio `1.10` (both pUSD and pGOLD). Two pAssets live: **pUSD** and **pGOLD**, each with its own CDP system, Stability Pool, and PSM. Chain: Sepolia `11155111`.

---

## Cross-cutting corrections

These apply across multiple pages; fix once per occurrence.

1. **Drop the hedging.** Replace "where available / where exposed / if the app offers it / protocol modules exposed by the current deployment" with the concrete behavior. The app is stable enough to state plainly; caveat only the genuinely beta-flagged bits with the app's own line ("not the final UI").
2. **"Recovery Mode" → confirm the term.** Docs say "Recovery Mode"; the **contracts** say **Emergency Mode** (`isEmergencyMode`, `EMERGENCY_MODE_MCR`). The concept page `redemptions-liquidations/recovery-mode` also uses "Recovery". Decide one term and use it everywhere; the contract-true term is **Emergency Mode**. (Verify what the connected Borrow UI displays.) Affects: borrow, manage-trove.
3. **Vocabulary: "trove" vs the app.** The app says **Borrow / loan / CDP / Collateral / Debt / LTV** — it does **not** say "trove" in the action surface (the Guide says "Open a pUSD CDP"). The using-app pages should match the app (CDP / loan / LTV), bridging to the concept term once: "a CDP (also called a trove)". Note: the wider docs brand this "Trove" (`_meta.js`: "Minting & Troves", page `manage-trove`); reconciling that is outside this section but worth a follow-up.
4. **pGOLD is first-class, not a footnote.** Borrow, Earn, and the PSM all support **pUSD and pGOLD** equally (sub-tabs). Stop writing pUSD-centric prose with pGOLD as an afterthought.
5. **APR is shown — say so.** The app displays concrete APRs (Dashboard cards; every Earn sub-tab; the fpETH card). The phrase "APR estimates are not guaranteed" is still correct as a caveat, but pages should acknowledge the number exists rather than implying it might not.
6. **Reserve loans = "Borrow ETH against fpETH."** Collateral is **fpETH**, you borrow **ETH**, at **100% LTV with no liquidation risk** (floor-protected). Do not describe reserve loans as minting/borrowing pUSD. Affects: borrow, split, the `peth/split` ↔ reserve-loan cross-links.
7. **Faucet specifics.** It is **permissionless**, on the **Dashboard** (STEP 2 "Get WETH") and in **Advanced**: pay **0.1 sepETH → receive 10 WETH**, **one claim per address every 4h**, **daily cap ~1,200 WETH**. Replace "the app faucet when it is enabled for your wallet" (quickstart) and similar vague lines.
8. **Activity panel + self-custody.** Worth one line where relevant: the Activity panel is **local, session-only** ("Cross-device history will land when we wire on-chain log scanning"); zapped/earned positions are **self-custodied** in the user's own address.
9. **Reference the Guide.** Add the in-app **Guide** tab to "Next actions"/intro links — it is the canonical "what should I do" map.

---

## Per-page review

Each entry: **Verdict → What's wrong/missing → Concrete fix.** "What it does" rewrites are drop-in.

### 1. `index.mdx` — Dashboard

**Verdict:** Largest mismatch in the section. Describes a read-only balances/positions/rewards table; the live Dashboard is an **onboarding + overview** screen.

**Wrong/missing:**
- "checks wallet balances, open positions, claimable rewards" — the live Dashboard ("Your Polaris") does **not** show a balances/positions/rewards table. It shows 3 APR summary cards, the 3-step onboarding (Connect → Get WETH → Earn pUSD), the fpETH long-term-yield card, and a price ticker. Per-position detail lives in Borrow/Earn.
- Conflates **Analytics** (separate external ↗ tab) into this page; describes Analytics contents that aren't verified.
- Lists "WETH, pETH, fpETH, vpETH, pAssets, POLAR" balances as the dashboard's job — that's the wallet/contextual surfaces, not the Dashboard tab.
- Misses: the on-Dashboard **faucet**, the **Activity** panel, the beta banner.

**Fix — "What it does":**
> The Dashboard ("Your Polaris") is your starting point and onboarding hub. It surfaces current Stability Pool and staking APRs, a three-step path to your first position (connect a wallet → claim test WETH from the faucet → earn pUSD), an fpETH long-term-yield shortcut, and a live price ticker for pETH, pUSD, pGOLD, and POLAR. The **Activity** panel logs what you do this session (local only). For position detail, use Borrow and Earn; for protocol-wide charts, open **Analytics** (a separate tab).

- Retitle page **"Dashboard"**; demote Analytics to a one-line pointer (and soften/verify its described contents).
- Move the faucet specifics (item 7) into "Before you start".

### 2. `swap.mdx` — Swap

**Verdict:** Close, but over-generalized. Swap is specifically the **bonding curve**, not a multi-asset router.

**Wrong/missing:**
- "exchanges app-supported assets… routes may include WETH, pETH, fpETH, vpETH, pAssets, or protocol modules" overstates scope. The live Swap is **Sell ETH ⇄ Buy pETH** via the bonding curve, route `WETH → BONDING CURVE → pETH`. (fpETH/vpETH are obtained on **Split**; pUSD/pGOLD via **Borrow** or **Advanced PSM** / market.)
- Misses the inline "What is pETH?" explainer and the Buy/Sell direction toggle.

**Fix — "What it does":**
> Swap is the bonding-curve interface for pETH. Sell ETH (WETH) to **buy** pETH, or sell pETH back for ETH — the route is always `WETH → bonding curve → pETH`. Each mint locks ETH into the curve's reserve at the current marginal price; pETH carries a hard, ever-rising price floor. (To get fpETH/vpETH use **Split**; to mint pUSD/pGOLD use **Borrow**.)

- Keep slippage/min-received/approval steps — accurate. Tighten the "Routes may include…" line out.

### 3. `borrow.mdx` — Borrow

**Verdict:** Right intent, wrong specifics; should absorb "manage."

**Wrong/missing:**
- Describes only pETH→pAsset CDPs and hedges reserve loans ("Where exposed… against fpETH"). Reality: **three sub-tabs — pUSD · pGOLD · ETH** — all first-class. The **ETH** tab is the reserve loan: **fpETH collateral → borrow ETH, 100% LTV, no liquidation risk.**
- Misses the actual UI: **LTV slider** (25/50/75% presets), **"Your effective rate"** (can be negative), **Projected position** panel (Liquidation at $, Est. monthly cost, LTV), Approve→Open, and that **existing positions are managed in this same tab** (no separate tab).
- "Recovery Mode" naming (item 2). "trove" vocabulary (item 3).

**Fix — "What it does":**
> Borrow is where you open and manage Polaris debt positions. Three sub-tabs: **pUSD** and **pGOLD** mint an overcollateralized stablecoin against **pETH** collateral; **ETH** is a reserve loan — borrow ETH against **fpETH** at up to 100% LTV with no liquidation risk (floor-protected). For pUSD/pGOLD you set collateral and debt with an LTV slider and see a projected liquidation price, estimated monthly cost, and effective rate before signing. Existing positions are adjusted, repaid, and closed from this same tab once your wallet is connected.

- Add a one-line note that pUSD/pGOLD CDPs carry liquidation + redemption + emergency-mode risk, while the ETH/fpETH reserve loan does not get liquidated.
- This makes a separate Manage Trove page redundant (next).

### 4. `manage-trove.mdx` — Manage Trove

**Verdict:** **Documents a tab that doesn't exist.** There is no "Manage Trove" in the nav; managing happens inside **Borrow**.

**Options (pick one):**
- **A (recommended): merge into `borrow.mdx`** as a "Manage an existing position" subsection and delete this page + its `_meta.js` entry. Matches the app 1:1 and removes a phantom destination.
- **B: keep but reframe** — retitle to clarify it is the Borrow tab's manage flow, remove every implication that it is its own tab, and fix the same naming/vocabulary issues. Lower value than A.

If kept, fix: "owns the trove" → "owns the position/loan"; "Recovery Mode" → Emergency Mode; and align actions to the real controls (collateral/debt fields + LTV slider, Approve, Close).

> Note: `agents/search-experience-upgrade.md` and `_meta.js` both reference "Manage Trove"; if you delete the page, update those and the sitemap/llms artifacts (the repo has a parity gate per `agents/cleanup-upgrade-plan.md`).

### 5. `earn.mdx` — Earn

**Verdict:** Directionally right, under-specified.

**Wrong/missing:**
- "POLAR staking controls where available" — staking is **present**, not conditional. The tab has **four sub-tabs: pUSD · pGOLD · POLAR · vpETH.**
- Omits **vpETH staking** entirely (earns a pETH stream from the bonding curve; High risk per Guide).
- Omits that each sub-tab shows a concrete **APR**, a **Deposit/Withdraw** (Stake/Unstake) toggle, and an **"Also claim pending …"** checkbox.
- The earlier code-only claim "the app shows no APR" was wrong — APR is shown (e.g., pUSD SP ~14–15%).

**Fix — "What it does":**
> Earn groups Polaris's yield positions across four sub-tabs: the **pUSD** and **pGOLD** Stability Pools (deposit a pAsset to backstop liquidations; earn pro-rata pAsset interest plus pETH liquidation gains), **POLAR** staking (earn a pro-rata share of borrower interest in pUSD/pGOLD, plus governance weight), and **vpETH** staking (earn a pETH stream from the bonding curve — higher risk, amplified). Each sub-tab shows its current APR, a deposit/withdraw (or stake/unstake) control, and an option to claim pending rewards in the same transaction.

- Keep "Stability Pool deposits are first-loss capital" and "APR not guaranteed" caveats. Point POLAR mechanics to `polar/`, vpETH to `peth/split`, SP to `yield`.

### 6. `split.mdx` — Split

**Verdict:** Accurate and the closest to reality — just thin vs. what the app teaches.

**Wrong/missing:**
- Doesn't state the app's headline guarantees: **1 pETH = 1 fpETH + 1 vpETH, no fees, no oracle, fully reversible by merging 1 fpETH + 1 vpETH.**
- Doesn't define the legs the way the app does: **fpETH = floor leg, redeemable at the bonding-curve floor, which only ever rises; vpETH = the above-floor volatility leg.**
- "Next actions: Use Borrow if reserve-loan actions are exposed for fpETH" — reserve loans are **not** conditional; link to the Borrow **ETH** sub-tab plainly. Also mention vpETH can be **staked** (Earn) for a pETH stream.
- Could note the live "What if…" price simulator as a way to build intuition.

**Fix — "What it does":**
> Split converts pETH into matching fpETH and vpETH at a fixed **1:1:1** ratio — no fees, no oracle, and fully reversible: merge 1 fpETH + 1 vpETH back into 1 pETH at any time. **fpETH** is the floor leg, redeemable for the bonding curve's floor price (which only ever rises), so it gains in ETH terms with little volatility. **vpETH** is the above-floor leg, absorbing all of pETH's volatility above the floor. Use this page for the workflow; see [pETH Split](/peth/split) for the mechanism.

- Next actions: Borrow **ETH** against fpETH; **stake vpETH** in Earn; Merge to recombine.

### 7. `zap.mdx` — Zap

**Verdict:** Good — the existing pUSD Stable Yield description and screenshot match. Just broaden to the real strategy set and tighten.

**Wrong/missing:**
- Presents one route generically; the app is a **strategy picker** with named cards — at least **pUSD Stable Yield** and **Floor Carry** (ETH → fpETH → borrow ETH, loopable, leveraged ETH yield; "Boost LST yield" appears in the Guide).
- Misses the app's own reassurances worth surfacing: **single transaction, you remain the position owner (self-custody), slippage is bounded by the slippage setting, the simulation confirms output before you sign, exit via the Earn tab.**

**Fix — "What it does":**
> Zap bundles several on-chain steps into one guided transaction. Pick a strategy: **pUSD Stable Yield** market-buys pUSD with your WETH and deposits it into the pUSD Stability Pool in a single tx; **Floor Carry** converts ETH into fpETH and borrows ETH against it (a non-liquidatable, loopable ETH-yield position). You stay the position owner with full self-custody, slippage is bounded by your slippage setting, and a simulation confirms the expected result before you sign. A zap is an execution shortcut — it doesn't change the economics of the underlying steps, and you can always exit or manage the resulting position from Earn or Borrow.

- Keep the strong "confirm final state, recover via Swap/Earn if a leg fails" guidance — it's good.

### 8. `advanced.mdx` — Advanced

**Verdict:** Substantially wrong about contents. Lists tools the tab doesn't have; omits the three it does.

**Wrong/missing:**
- Claims Advanced has "manual approvals, reserve-loan controls, staking controls, contract checks." Reality — Advanced = **"Expert operations… for arbitrageurs and keepers"** with exactly three modules:
  1. **PSM** — Mint/Redeem **pUSD and pGOLD**: swap pETH ⇄ pAsset at the **oracle price**, permissionless and unlimited; arbitrage that holds the peg.
  2. **Convert pETH → POLAR** — a **one-way** auction (spike-and-decay price): pETH is **burned** (raising the floor), POLAR minted; in practice run by MEV/arb bots.
  3. **Testnet ETH Faucet** — 0.1 sepETH → 10 WETH, 1 claim / 4h, ~1,200/day cap.
- Reserve loans and staking are **not** here (Borrow / Earn). Remove those claims.

**Fix — "What it does":**
> Advanced holds expert, permissionless operations aimed at arbitrageurs and keepers — deeper mechanism knowledge assumed. Three modules: the **Peg Stability Module (PSM)** mints or redeems pUSD/pGOLD against pETH at the oracle price in unlimited size (the arbitrage that anchors each peg); **Convert pETH → POLAR** runs the one-way conversion auction (pETH is burned, raising the bonding-curve floor, and POLAR is minted at the decaying auction price); and the **Testnet ETH Faucet** dispenses test WETH. Most users never need this tab — the guided tabs cover normal flows.

- Cross-link PSM to `peth`/peg mechanics, conversion to `polar/conversion-auctions`, faucet to `resources/testnet`.

---

## Recommended structure & artifact changes

| Change | Why | Touches |
|---|---|---|
| Retitle index page **"Dashboard"**; treat Analytics as an external pointer | Matches nav; stops over-claiming Analytics | `index.mdx`, `_meta.js` |
| Merge Manage Trove into Borrow, delete the page (Option A) | No such tab exists; removes phantom destination | `manage-trove.mdx`, `borrow.mdx`, `_meta.js`, sitemap, `public/llms-*` |
| Add a one-line **Guide** reference from the section intro / Next actions | The in-app Guide is the canonical "what to do" map | all `using-app/*` |
| Decide **Emergency Mode** vs Recovery Mode and apply everywhere | Contract-true term is Emergency Mode | borrow, manage-trove, `redemptions-liquidations/*` |
| Align vocabulary to the app (CDP/loan/LTV, bridge to "trove" once) | Page must read like the app it documents | borrow, manage-trove |

**Screenshots:** `public/screenshots/{dashboard,swap,borrow,earn,split}.jpg` and `zap.png` are real live-app captures (June 8) and match. **Missing:** no screenshot for **Advanced** (PSM/convert/faucet) or **Split** is present but the page could use the live readout; consider adding an `advanced.jpg`. The `manage-trove.mdx` page has no screenshot (consistent with it not being a real tab).

**Consistency with prior plans:** `agents/full-application-surface-docs-report.md` already flagged the using-app tabs as "thin"; this review supplies the concrete content to thicken them. Keep edits aligned with `agents/wordiness-fix.md` (tighten at sentence level, preserve voice and caveats) and the parity gate in `agents/cleanup-upgrade-plan.md` (regenerate sitemap + `llms-*` after any route change).

---

## Prioritized actions

| Priority | Action | Page(s) |
|---|---|---|
| **P0** | Rewrite `advanced.mdx` to the real 3 modules (PSM pUSD+pGOLD, convert→POLAR, faucet); delete the false tool list | advanced |
| **P0** | Fix `index.mdx`: Dashboard = onboarding/overview (APR cards, faucet, Activity, ticker), not a balances table; split Analytics out | index |
| **P0** | Resolve Manage Trove: merge into Borrow (Option A) and update `_meta.js`/sitemap/llms | manage-trove, borrow, _meta.js |
| **P1** | Borrow: document sub-tabs (pUSD/pGOLD/ETH), LTV slider, effective rate, Projected position; fix reserve-loan = ETH-against-fpETH | borrow |
| **P1** | Earn: document 4 sub-tabs incl. **vpETH staking**; acknowledge APR is shown | earn |
| **P1** | Swap: scope to the bonding curve (ETH ⇄ pETH); drop multi-asset router language | swap |
| **P1** | Emergency vs Recovery Mode decision + apply | borrow, manage-trove, concepts |
| **P2** | Split: add 1:1:1/no-fee/no-oracle/reversible + fpETH/vpETH definitions; fix Next actions | split |
| **P2** | Zap: add Floor Carry (+ Boost LST yield), self-custody/slippage/simulation notes | zap |
| **P2** | Strip residual hedging; add Guide links; align vocabulary to the app | all |
| **P2** | Faucet specifics (0.1 sepETH → 10 WETH, 4h, ~1,200/day) in Dashboard + quickstart | index, quickstart |
| **P2** | Capture an `advanced.jpg` screenshot | advanced |

---

## Open items (verify with a connected wallet)

These I could not confirm without connecting a wallet (intentionally not done):

1. **Borrow management controls** — exact labels/flow for adjust / repay / withdraw / close, and whether the connected Borrow tab surfaces an "Emergency Mode" banner or just an LTV/health warning.
2. **Earn** — exact Stake/Unstake vs Deposit/Withdraw wording on POLAR/vpETH sub-tabs and whether claim is a separate button.
3. **Analytics tab** — its destination URL and actual contents (the index page currently describes them speculatively).
4. **Zap** — the full strategy list (confirmed pUSD Stable Yield + Floor Carry; "Boost LST yield" seen in Guide — confirm it's a live Zap card vs. manual).
5. **Slippage/settings control** — where it lives (only rendered post-connect on Swap/Zap).
6. **Exact max LTV / liquidation thresholds** shown in the Borrow UI vs. the manifest MCR (115%).
