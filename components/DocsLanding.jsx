import { ArrowRight, BookOpen, ChartLine, FlaskConical, Hexagon, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { pathWithBase } from '../app/site-config.mjs'

const paths = [
  {
    label: 'pETH',
    description: 'Understand the reserve asset at the center of Polaris.',
    route: '/core-assets/peth',
    icon: Hexagon
  },
  {
    label: 'Bonding Curve',
    description: 'See how ETH enters the system and establishes the pETH floor.',
    route: '/architecture/bonding-curve',
    icon: ChartLine
  },
  {
    label: 'Using the Testnet',
    description: 'Connect on Sepolia and work through the live application.',
    route: '/testnet/guide',
    icon: FlaskConical
  },
  {
    label: 'Risks',
    description: 'Review the guarantees, trade-offs, and risks that remain.',
    route: '/risks',
    icon: ShieldAlert
  }
]

export function DocsLanding() {
  return (
    <div className="pl-docs-home">
      <section className="pl-docs-home-section" aria-labelledby="pl-docs-start-title">
        <h2 id="pl-docs-start-title">Start with Polaris</h2>
        <Link className="pl-docs-start-link" href={pathWithBase('/polaris-101')}>
          <span className="pl-docs-link-icon" aria-hidden="true">
            <BookOpen size={21} strokeWidth={1.8} />
          </span>
          <span className="pl-docs-link-copy">
            <strong>Polaris 101</strong>
            <span>A concise introduction to the assets, flows, and economics of the system.</span>
          </span>
          <ArrowRight className="pl-docs-link-arrow" aria-hidden="true" size={20} />
        </Link>
      </section>

      <nav className="pl-docs-home-section" aria-labelledby="pl-docs-paths-title">
        <h2 id="pl-docs-paths-title">Explore by goal</h2>
        <div className="pl-docs-path-list">
          {paths.map(({ label, description, route, icon: Icon }) => (
            <Link key={route} className="pl-docs-path-link" href={pathWithBase(route)}>
              <span className="pl-docs-link-icon" aria-hidden="true">
                <Icon size={19} strokeWidth={1.8} />
              </span>
              <span className="pl-docs-link-copy">
                <strong>{label}</strong>
                <span>{description}</span>
              </span>
              <ArrowRight className="pl-docs-link-arrow" aria-hidden="true" size={18} />
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
