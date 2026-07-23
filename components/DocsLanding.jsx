import {
  ArrowRight,
  BookOpen,
  Coins,
  ExternalLink,
  FlaskConical,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingUp
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
    label: 'The bonding curve',
    description: 'How ETH deposits mint pETH on a shared curve.',
    route: '/architecture/bonding-curve',
    icon: TrendingUp
  },
  {
    label: 'pETH',
    description: 'The native yield-bearing asset behind every pAsset.',
    route: '/core-assets/peth',
    icon: Coins
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

      <TestnetBanner />

      <nav className="pl-docs-home-section" aria-labelledby="pl-docs-trust-title">
        <h2 id="pl-docs-trust-title">Security and trust</h2>
        <div className="pl-docs-trust-grid">
          {trustLinks.map((item) => (
            <LandingLink key={item.route} className="pl-docs-row-link" item={item} />
          ))}
        </div>
      </nav>
    </div>
  )
}
