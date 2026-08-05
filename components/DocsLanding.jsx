import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { pathWithBase } from '../app/site-config.mjs'
import { Glyph } from './icons/Glyph.js'
import { LiquidMetalSymbol } from './LiquidMetalSymbol.jsx'

const entryPoints = [
  {
    label: 'Polaris 101',
    description: 'An intro to the ecosystem',
    route: '/polaris-101',
    glyph: 'BookOpen',
    tone: 'gold'
  },
  {
    label: 'The Foundation',
    description: 'Learn the ideas behind the design',
    route: '/overview/manifesto',
    glyph: 'Compass',
    tone: 'gold'
  },
  {
    label: 'Core Assets',
    description: 'Explore what each asset does',
    route: '/core-assets/peth',
    glyph: 'Coins',
    tone: 'blue'
  },
  {
    label: 'Core Architecture',
    description: 'Understand the structure',
    route: '/architecture/bonding-curve',
    glyph: 'Network',
    tone: 'violet'
  },
  {
    label: 'Protocol Mechanics',
    description: 'Learn how the system works',
    route: '/design/fee-router',
    glyph: 'Cog',
    tone: 'teal'
  },
  {
    label: 'Risks',
    description: 'Review guarantees and risks',
    route: '/risks',
    glyph: 'ShieldAlert',
    tone: 'rust'
  },
  {
    label: 'Use Polaris',
    description: 'Learn to use the testnet',
    route: '/testnet/guide',
    glyph: 'FlaskConical',
    tone: 'green'
  }
]

function LandingCard({ item }) {
  const { label, description, route, glyph, tone } = item

  return (
    <Link className={`pl-docs-card-link pl-motion pl-icon-tone-${tone}`} href={pathWithBase(route)}>
      <span className="pl-docs-link-icon">
        <Glyph name={glyph} size={32} />
      </span>
      <span className="pl-docs-link-copy">
        <strong className="pl-docs-card-title">
          {label}
          <ChevronRight aria-hidden="true" className="pl-docs-title-chevron" />
        </strong>
        <span>{description}</span>
      </span>
    </Link>
  )
}

function FeaturedLandingCard({ item }) {
  const { label, description, route } = item

  return (
    <Link className="pl-docs-card-link pl-docs-featured-card" href={pathWithBase(route)}>
      <span className="pl-docs-featured-copy">
        <h2 className="pl-docs-card-title">
          {label}
          <ChevronRight aria-hidden="true" className="pl-docs-title-chevron" />
        </h2>
        <p>{description}</p>
      </span>
      <LiquidMetalSymbol image={pathWithBase('/symbol-fallback.png')} />
    </Link>
  )
}

export function DocsLanding() {
  const [featuredEntryPoint, ...entryPointCards] = entryPoints

  return (
    <nav className="pl-docs-home" aria-label="Explore Polaris documentation">
      <div className="pl-docs-entry-grid">
        <FeaturedLandingCard item={featuredEntryPoint} />
        {entryPointCards.map((item) => (
          <LandingCard key={item.route} item={item} />
        ))}
      </div>
    </nav>
  )
}
