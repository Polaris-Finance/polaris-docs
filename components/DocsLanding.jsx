import Link from 'next/link'
import { pathWithBase } from '../app/site-config.mjs'
import { Glyph } from './icons/Glyph.js'

const entryPoints = [
  {
    label: 'TLDR',
    description: 'Get the protocol essentials in a few minutes.',
    route: '/polaris-101',
    glyph: 'BookOpen',
    tone: 'gold'
  },
  {
    label: 'The Foundation',
    description: 'Understand the ideas and purpose behind Polaris.',
    route: '/overview/manifesto',
    glyph: 'Compass',
    tone: 'gold'
  },
  {
    label: 'Core Assets',
    description: 'Meet the assets at the heart of the protocol.',
    route: '/core-assets/peth',
    glyph: 'Coins',
    tone: 'blue'
  },
  {
    label: 'Core Architecture',
    description: 'See how the core systems fit together.',
    route: '/architecture/bonding-curve',
    glyph: 'Network',
    tone: 'violet'
  },
  {
    label: 'Protocol Mechanics',
    description: 'Explore the mechanisms that keep Polaris working.',
    route: '/design/fee-router',
    glyph: 'Cog',
    tone: 'teal'
  },
  {
    label: 'Risks',
    description: 'Review the protocol assumptions, guarantees, and risks.',
    route: '/risks',
    glyph: 'ShieldAlert',
    tone: 'rust'
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
        <strong>{label}</strong>
        <span>{description}</span>
      </span>
    </Link>
  )
}

export function DocsLanding() {
  return (
    <nav className="pl-docs-home" aria-label="Explore Polaris documentation">
      <div className="pl-docs-entry-grid">
        {entryPoints.map((item) => (
          <LandingCard key={item.route} item={item} />
        ))}
      </div>
    </nav>
  )
}
