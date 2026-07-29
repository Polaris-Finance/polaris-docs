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
import { EXTERNAL_LINKS, toneForRoute } from '../app/navigation-config.mjs'
import { pathWithBase } from '../app/site-config.mjs'

// Description lengths are deliberately uneven: a grid of equal-length blurbs is
// most of what makes a landing page read as generated rather than written.
const welcomeLinks = [
  {
    label: 'Polaris 101',
    description: 'Learn the basics',
    route: '/polaris-101',
    icon: BookOpen
  },
  {
    label: 'The Bonding Curve',
    description:
      'The journey from ETH to pETH',
    route: '/architecture/bonding-curve',
    icon: TrendingUp
  },
  {
    label: 'pETH',
    description: 'The native yield-bearing collateral',
    route: '/core-assets/peth',
    icon: Coins
  }
]

const trustLinks = [
  {
    label: 'Security Guarantees',
    description: 'Learn what is guaranteed',
    route: '/risks/security-properties',
    icon: ShieldCheck
  },
  {
    label: 'Risks Overview',
    description: 'Evaluate risks',
    route: '/risks',
    icon: ShieldAlert
  },
  {
    label: 'Stewardship',
    description: 'Explore how growth is coordinated',
    route: '/architecture/stewardship',
    icon: Scale
  }
]

function LandingLink({ className, item, iconSize = 22, withArrow = false }) {
  const { label, description, route, icon: Icon } = item

  return (
    <Link className={className} href={pathWithBase(route)}>
      <span className={`pl-docs-link-icon pl-icon-tone-${toneForRoute(route)}`} aria-hidden="true">
        <Icon size={iconSize} strokeWidth={1.8} />
      </span>
      <span className="pl-docs-link-copy">
        <strong>{label}</strong>
        {description ? <span>{description}</span> : null}
      </span>
      {withArrow ? (
        <ArrowRight className="pl-docs-link-arrow" aria-hidden="true" size={18} />
      ) : null}
    </Link>
  )
}

export function TestnetBanner() {
  return (
    <aside className="pl-testnet-banner" aria-label="Public Testnet 1">
      <span className="pl-testnet-banner-icon pl-icon-tone-green" aria-hidden="true">
        <FlaskConical size={22} strokeWidth={1.8} />
      </span>
      <span className="pl-testnet-banner-copy">
        <strong>Testnet v1 is Live</strong>
        <span>Explore Polaris with test assets</span>
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
              className="pl-docs-card-link pl-docs-welcome-link"
              item={item}
              withArrow={false}
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
