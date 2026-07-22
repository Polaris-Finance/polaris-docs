'use client'

import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GitHubIcon } from 'nextra/icons'
import { BASE_PATH, pathWithBase } from '../app/site-config.mjs'
import { EXTERNAL_LINKS, FOOTER_GROUPS, normalizeRoute } from '../app/navigation-config.mjs'

function routeFromPathname(pathname) {
  const withoutBase =
    BASE_PATH && pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) : pathname
  return normalizeRoute(withoutBase || '/')
}

function FooterLink({ link, currentRoute }) {
  if (link.type === 'route') {
    return (
      <Link
        href={link.route}
        className="pl-footer-link"
        aria-current={link.route === currentRoute ? 'page' : undefined}
      >
        {link.label}
      </Link>
    )
  }

  const external = link.type === 'external'
  return (
    <a
      href={external ? link.href : pathWithBase(link.href)}
      className="pl-footer-link"
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
    >
      {link.label}
      {external ? <ExternalLink aria-hidden="true" size={13} strokeWidth={1.8} /> : null}
      {external ? <span className="pl-sr-only"> opens in a new tab</span> : null}
    </a>
  )
}

export function PolarisFooter() {
  const pathname = usePathname()
  const currentRoute = routeFromPathname(pathname)

  return (
    <footer className="pl-footer" aria-label="Footer">
      <div className="pl-footer-inner">
        <nav className="pl-footer-columns" aria-label="Footer navigation">
          {FOOTER_GROUPS.map((group) => (
            <section key={group.id} className="pl-footer-column" aria-labelledby={group.id}>
              <h2 id={group.id}>{group.label}</h2>
              <ul>
                {group.links.map((link) => (
                  <li key={link.route ?? link.href}>
                    <FooterLink link={link} currentRoute={currentRoute} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        <div className="pl-footer-brand">
          <div className="pl-footer-identity">
            <img src={pathWithBase('/emblem.svg')} alt="" width={28} height={28} />
            <div>
              <strong>Polaris</strong>
              <p>The pETH-powered yield layer for all of DeFi</p>
            </div>
          </div>
          <div className="pl-footer-meta">
            <span>© {new Date().getFullYear()} Polaris</span>
            <nav className="pl-footer-social" aria-label="Polaris links">
              <a
                href={EXTERNAL_LINKS.github}
                aria-label="Polaris on GitHub, opens in a new tab"
                title="GitHub"
                target="_blank"
                rel="noreferrer"
              >
                <GitHubIcon aria-hidden="true" width="17" height="17" />
              </a>
              <a
                href={EXTERNAL_LINKS.x}
                aria-label="Polaris on X, opens in a new tab"
                title="X"
                target="_blank"
                rel="noreferrer"
              >
                <span className="pl-footer-x-glyph" aria-hidden="true">
                  X
                </span>
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
