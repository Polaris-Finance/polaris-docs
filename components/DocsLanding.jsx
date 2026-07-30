import Link from 'next/link'
import { EXTERNAL_LINKS } from '../app/navigation-config.mjs'
import { pathWithBase } from '../app/site-config.mjs'
import { Glyph } from './icons/Glyph.js'
import { ASSET_ICONS } from './navigation/NavIcon.js'

// Polaris 101 is the featured entry point (CEO direction, July 2026): a
// full-width block above the primary grid, carrying the same label, blurb and
// href the welcome card used to.
const heroLink = {
  label: 'Polaris 101',
  description: 'Learn the basics',
  route: '/polaris-101',
  glyph: 'BookOpen'
}

// Accents are explicit per surface rather than derived from the route: the
// landing is its own board, so USDp reads green here while its sidebar section
// stays Core-Assets blue. Description lengths are deliberately uneven — a grid
// of equal-length blurbs is most of what makes a landing read as generated.
const primaryLinks = [
  {
    label: 'pETH',
    description: 'The native yield-bearing collateral',
    route: '/core-assets/peth',
    glyph: 'asset:peth',
    tone: 'blue'
  },
  {
    label: 'The Bonding Curve',
    description: 'The journey from ETH to pETH',
    route: '/architecture/bonding-curve',
    glyph: 'ChartLine',
    tone: 'violet'
  },
  {
    label: 'USDp',
    description: 'The native Polaris dollar',
    route: '/core-assets/usdp',
    glyph: 'asset:usdp',
    tone: 'green'
  },
  {
    label: 'Reserve Loans',
    description: 'Borrow ETH directly from the reserve',
    route: '/architecture/reserve-loans',
    glyph: 'HandCoins',
    tone: 'rust'
  }
]

const trustLinks = [
  {
    label: 'Security Guarantees',
    description: 'Learn what is guaranteed',
    route: '/risks/security-properties',
    glyph: 'ShieldCheck',
    tone: 'teal'
  },
  {
    label: 'Risks Overview',
    description: 'Evaluate risks',
    route: '/risks',
    glyph: 'TriangleAlert',
    tone: 'rust'
  },
  {
    label: 'Stewardship',
    description: 'Explore how growth is coordinated',
    route: '/architecture/stewardship',
    glyph: 'Scale',
    tone: 'violet'
  }
]

/* pETH and USDp show their real token logos rather than a drawn glyph (colleague
   feedback, July 2026). The PNGs are the untouchable pAsset artwork, reused
   as-is at full colour — they are the tokens' identity, not decoration. */
function LandingIcon({ glyph, size }) {
  if (ASSET_ICONS[glyph]) {
    return (
      <img
        aria-hidden="true"
        alt=""
        className="pl-docs-link-logo"
        decoding="async"
        height={size}
        /* Lazy, like the nav rail's copies: eager <img> makes Next emit a
           rel=preload for each PNG, which check:artifact rejects outright.
           They are 4–6 KB decorations next to a text LCP, so nothing is lost. */
        loading="lazy"
        src={pathWithBase(ASSET_ICONS[glyph])}
        width={size}
      />
    )
  }

  return <Glyph name={glyph} size={size} />
}

function LandingLink({ className, item, iconSize = 32 }) {
  const { label, description, route, glyph, tone } = item

  return (
    <Link className={`${className} pl-motion pl-icon-tone-${tone}`} href={pathWithBase(route)}>
      <span className="pl-docs-link-icon">
        <LandingIcon glyph={glyph} size={iconSize} />
      </span>
      <span className="pl-docs-link-copy">
        <strong>{label}</strong>
        {description ? <span>{description}</span> : null}
      </span>
    </Link>
  )
}

function LandingHero() {
  return (
    <Link className="pl-docs-hero pl-motion pl-icon-tone-gold" href={pathWithBase(heroLink.route)}>
      <span className="pl-docs-hero-icon">
        <Glyph name={heroLink.glyph} size={42} strokeWidth={1.5} />
      </span>
      <span className="pl-docs-hero-copy">
        <strong>{heroLink.label}</strong>
        <span>{heroLink.description}</span>
      </span>
    </Link>
  )
}

export function TestnetBanner() {
  return (
    <aside className="pl-testnet-banner pl-motion pl-icon-tone-green" aria-label="Public Testnet 1">
      <span className="pl-testnet-banner-icon">
        <Glyph name="FlaskConical" size={24} />
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
        <LandingHero />
        <div className="pl-docs-welcome-grid">
          {primaryLinks.map((item) => (
            <LandingLink key={item.route} className="pl-docs-card-link" item={item} />
          ))}
        </div>
      </nav>

      <TestnetBanner />

      <nav className="pl-docs-home-section" aria-labelledby="pl-docs-trust-title">
        <h2 id="pl-docs-trust-title">Security and trust</h2>
        <div className="pl-docs-trust-grid">
          {trustLinks.map((item) => (
            <LandingLink key={item.route} className="pl-docs-row-link" item={item} iconSize={24} />
          ))}
        </div>
      </nav>
    </div>
  )
}
