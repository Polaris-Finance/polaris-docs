# Product

## Register

product

## Users

Technically-literate people who are **new to Polaris** — DeFi-fluent readers evaluating or learning to use the protocol, not the team that built it. They arrive in one of two modes:

- **Primary: prospective participants** — people deciding whether to mint pAssets, deposit ETH into the bonding curve, earn yield in the Stability Pool, or hold/convert POLAR. Their context is "I understand DeFi mechanics in general; show me how *this* system works and what it costs me." They read to decide and to act.

Most readers arrive **pre-mainnet** (Public Testnet 1 is live on Sepolia; mainnet is forthcoming), so they are forming a first impression of an evolving system whose final parameters are not all fixed.

## Product Purpose

Documentation that makes a genuinely hard system **understandable and usable**: Polaris, the **pETH-powered yield layer for all of DeFi** (a self-scaling, counterparty-free stablecoin operating system). It explains how the three engines (pAssets / CDP, pETH / bonding curve, POLAR / conversion) work, how to use them, and the trade-offs each one makes.

Success is **comprehension**: a technically-literate newcomer leaves able to explain what Polaris does, why it is architected to stay trustless at scale, and what a given action will do to their position — without having to read the contracts. It is a reference tool first; the brand expression serves that comprehension, never competes with it.

## Brand Personality

**Cerebral, candid, principled.**

- **Cerebral** — classical and considered. Editorial serif headings, "every concept introduced from the familiar thing first," a counterparty-free *lineage* told as history. It respects the reader's intelligence.
- **Candid** — says things plainly. Where a parameter isn't fixed, it says so rather than inventing a number; pages name what the system does *not* do; risk is stated at the point of decision, not buried.
- **Principled** — a counterculture conviction without the hype. "Putting the De back into DeFi." "No T-bills. No CEXs. No compromises." Confidence comes from architecture and precision, not adjectives.

Emotional goal: **earned trust through clarity**. The reader should feel they are being leveled with by experts, not sold to.

## Anti-references

This must NOT look or feel like any of:

- **Generic DeFi degen** — neon-on-black, glowing gradients, APY-bait, rocket/moon hype, animated-coin gimmicks. The speculative-casino aesthetic is the opposite of the project's thesis.
- **Sterile corporate fintech** — Stripe/Circle-style blue-and-white SaaS, stock illustration, marketing buzzwords, the "institutional T-bill desk" polish the protocol explicitly rejects.
- **Generic dev-docs template** — undifferentiated Docusaurus/GitBook grey: no identity, everything a card, flat hierarchy, "every docs site looks the same."
- **Overwrought / cluttered** — decorative effects for their own sake, glassmorphism everywhere, busy backgrounds that fight the readability of dense technical content.

## Design Principles

1. **Familiar thing first.** Introduce every concept by anchoring it to something the reader already knows (a CDP, a bonding curve, a stablecoin they've used), then show how Polaris differs. Comprehension is the product.
2. **Honest by construction.** Show trade-offs, name what the system does *not* do, and put risk and caveats at the point of decision. When a parameter isn't final, say so plainly. Trust is earned by candor, not asserted.
3. **Readability outranks decoration.** On dense technical content, when brand expression and legibility conflict, legibility wins. Effects must clarify (a diagram, a depth meter, a status badge), never just impress.
4. **Expert confidence, not hype.** Authority comes from precision and plain language. No buzzwords, no urgency theater, no manufactured excitement — the architecture is the argument.
5. **Identity layered on restraint.** The Celestial Night Sky theme carries warmth and character; the structure underneath stays a clean, fast, navigable reference. The brand is the frame, not the noise.

## Accessibility & Inclusion

- **Target: WCAG 2.2 AA.** The project already invests here (a corrected light-mode focus-ring in `globals.css`; reduced-motion fallbacks on the timeline and card animations).
- **Dark mode is canonical**, light mode is fully supported — both must meet AA. Body text uses Star (`#E8DCC4`), never pure white, and must clear 4.5:1 against its navy/cream surface; verify on tinted backgrounds where muted text tends to fail.
- **Reduced motion is not optional** — the twinkle/halo and card-hover animations already gate on `prefers-reduced-motion`; any new motion must do the same.
- **Don't encode meaning in color alone** — token colors (pUSD/pETH/POLAR) and status (done/now/forthcoming) must also read via label, shape, or text, for color-blind readers.
