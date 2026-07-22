import { ExternalLink } from 'lucide-react'
import { GitHubIcon } from 'nextra/icons'
import { pathWithBase } from '../app/site-config.mjs'
import { EXTERNAL_LINKS, FOOTER_LINKS } from '../app/navigation-config.mjs'

function FooterLink({ link }) {
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
  return (
    <footer className="pl-footer" aria-label="Footer">
      <div className="pl-footer-inner">
        <div className="pl-footer-identity">
          <img src={pathWithBase('/emblem.svg')} alt="" width={28} height={28} />
          <div>
            <strong>Polaris</strong>
            <p>The pETH-powered yield layer for all of DeFi</p>
          </div>
        </div>

        <nav className="pl-footer-links" aria-label="Polaris resources">
          {FOOTER_LINKS.map((link) => (
            <FooterLink key={link.href} link={link} />
          ))}
          <a
            className="pl-footer-social-link"
            href={EXTERNAL_LINKS.github}
            aria-label="Polaris on GitHub, opens in a new tab"
            title="GitHub"
            target="_blank"
            rel="noreferrer"
          >
            <GitHubIcon aria-hidden="true" width="17" height="17" />
          </a>
          <a
            className="pl-footer-social-link"
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

        <span className="pl-footer-copyright">© {new Date().getFullYear()} Polaris</span>
      </div>
    </footer>
  )
}
