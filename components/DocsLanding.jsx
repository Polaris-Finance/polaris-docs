import {
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  ChartPie,
  Coins,
  ExternalLink,
  FlaskConical,
  Gavel,
  HandCoins,
  Network,
  Percent,
  RefreshCw,
  Route,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Stamp,
  TrendingUp,
  Waves,
  Workflow
} from 'lucide-react'
import Link from 'next/link'
import { EXTERNAL_LINKS } from '../app/navigation-config.mjs'
import { pathWithBase } from '../app/site-config.mjs'

const welcomeLinks = [
  {
    label: 'Polaris 101',
    description: 'An introduction to Polaris and the ideas behind it.',
    route: '/polaris-101',
    icon: BookOpen,
    featured: true
  },
  {
    label: 'How Polaris works',
    description: 'Follow value through the protocol and its connected engines.',
    route: '/architecture/flows',
    icon: Workflow
  },
  {
    label: 'Core assets',
    description: 'Understand pETH, pAssets, POLAR, and their roles in the system.',
    route: '/core-assets/peth',
    icon: Coins
  }
]

const actionLinks = [
  {
    label: 'Mint a pAsset',
    description: 'Open and manage a collateralized USDp or GOLDp position.',
    route: '/testnet/mint',
    icon: Stamp
  },
  {
    label: 'Deposit ETH',
    description: 'Enter the bonding curve to mint pETH on the public testnet.',
    route: '/testnet/swap',
    icon: ArrowLeftRight
  },
  {
    label: 'Earn yield',
    description: 'Deposit into the auto-compounding Polaris Earn Vaults.',
    route: '/testnet/earn',
    icon: TrendingUp
  },
  {
    label: 'Take a reserve loan',
    description: 'Borrow ETH against fpETH through a non-liquidatable Reserve Loan.',
    route: '/testnet/reserve-loan',
    icon: HandCoins
  },
  {
    label: 'Convert assets',
    description: 'Use direct minting, redemption, and conversion mechanisms.',
    route: '/testnet/advanced',
    icon: RefreshCw
  },
  {
    label: 'Provide liquidity',
    description: 'Join Polaris pools and earn a share of their swap fees.',
    route: '/testnet/liquidity',
    icon: Waves
  }
]

const trustLinks = [
  {
    label: 'Security guarantees',
    description: 'See what the protocol guarantees by construction.',
    route: '/risks/security-properties',
    icon: ShieldCheck
  },
  {
    label: 'Risks and trade-offs',
    description: 'Evaluate the risks that remain before participating.',
    route: '/risks',
    icon: ShieldAlert
  },
  {
    label: 'Stewardship',
    description: 'See how bounded controls guide the protocol.',
    route: '/architecture/stewardship',
    icon: Scale
  }
]

const referenceLinks = [
  { label: 'Protocol flows', route: '/architecture/flows', icon: Network },
  { label: 'Tokenomics', route: '/architecture/tokenomics', icon: ChartPie },
  { label: 'Interest rates', route: '/design/interest-rates', icon: Percent },
  { label: 'Fee routing', route: '/design/fee-router', icon: Route },
  { label: 'Conversions', route: '/design/conversions', icon: RefreshCw },
  { label: 'Liquidations', route: '/design/liquidations', icon: Gavel }
]

function LandingLink({ className, item, iconSize = 19 }) {
  const { label, description, route, icon: Icon } = item

  return (
    <Link className={className} href={pathWithBase(route)}>
      <span className="pl-docs-link-icon" aria-hidden="true">
        <Icon size={iconSize} strokeWidth={1.8} />
      </span>
      <span className="pl-docs-link-copy">
        <strong>{label}</strong>
        {description ? <span>{description}</span> : null}
      </span>
      <ArrowRight className="pl-docs-link-arrow" aria-hidden="true" size={18} />
    </Link>
  )
}

export function TestnetBanner() {
  return (
    <aside className="pl-testnet-banner" aria-label="Public Testnet 1">
      <span className="pl-testnet-banner-icon" aria-hidden="true">
        <FlaskConical size={22} strokeWidth={1.8} />
      </span>
      <span className="pl-testnet-banner-copy">
        <strong>Public Testnet 1 is live on Sepolia</strong>
        <span>Connect to the app and explore Polaris with test assets.</span>
      </span>
      <span className="pl-testnet-banner-actions">
        <a
          className="pl-testnet-banner-primary"
          href={EXTERNAL_LINKS.testnetApp}
          target="_blank"
          rel="noreferrer"
        >
          Open App
          <ExternalLink aria-hidden="true" size={15} strokeWidth={1.8} />
          <span className="pl-sr-only"> opens in a new tab</span>
        </a>
        <Link className="pl-testnet-banner-secondary" href={pathWithBase('/testnet/guide')}>
          View guide
          <ArrowRight aria-hidden="true" size={15} strokeWidth={1.8} />
        </Link>
      </span>
    </aside>
  )
}

export function DocsLanding() {
  return (
    <div className="pl-docs-home">
      <nav className="pl-docs-home-section" aria-labelledby="pl-docs-welcome-title">
        <h2 id="pl-docs-welcome-title">Welcome to Polaris</h2>
        <div className="pl-docs-welcome-grid">
          {welcomeLinks.map((item) => (
            <LandingLink
              key={item.route}
              className={[
                'pl-docs-card-link',
                'pl-docs-welcome-link',
                item.featured ? 'pl-docs-welcome-link-featured' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              item={item}
              iconSize={item.featured ? 21 : 19}
            />
          ))}
        </div>
      </nav>

      <nav className="pl-docs-home-section" aria-labelledby="pl-docs-actions-title">
        <h2 id="pl-docs-actions-title">Use Polaris</h2>
        <div className="pl-docs-action-grid">
          {actionLinks.map((item) => (
            <LandingLink
              key={item.route}
              className="pl-docs-card-link pl-docs-action-link"
              item={item}
            />
          ))}
        </div>
      </nav>

      <nav className="pl-docs-home-section" aria-labelledby="pl-docs-trust-title">
        <h2 id="pl-docs-trust-title">Security and trust</h2>
        <div className="pl-docs-trust-grid">
          {trustLinks.map((item) => (
            <LandingLink key={item.route} className="pl-docs-row-link" item={item} />
          ))}
        </div>
      </nav>

      <nav className="pl-docs-home-section" aria-labelledby="pl-docs-reference-title">
        <h2 id="pl-docs-reference-title">Protocol reference</h2>
        <div className="pl-docs-reference-grid">
          {referenceLinks.map((item) => (
            <LandingLink
              key={item.route}
              className="pl-docs-reference-link"
              item={item}
              iconSize={17}
            />
          ))}
        </div>
      </nav>
    </div>
  )
}
