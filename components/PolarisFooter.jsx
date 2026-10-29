import { pathWithBase } from '../app/site-config.mjs'
import { FOOTER_LINKS } from '../app/navigation-config.mjs'

function PolarisFooterEmblem() {
  return (
    <svg
      className="pl-footer-emblem"
      viewBox="0 0 28 28"
      width="24"
      height="24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="pl-footer-emblem-part"
        d="M1.47723 14.5265C5.20639 14.5265 7.07101 14.5264 8.54182 15.1356C10.5029 15.948 12.061 17.5061 12.8733 19.4672C13.4825 20.938 13.4825 22.8026 13.4825 26.5317V27.0399C13.4825 27.478 13.4825 27.697 13.4092 27.8067C13.3115 27.9529 13.1352 28.0259 12.9627 27.9916C12.8333 27.9659 12.6784 27.811 12.3687 27.5013L0.507713 15.6403C0.197997 15.3306 0.0431392 15.1757 0.0173975 15.0463C-0.0169249 14.8738 0.0560741 14.6975 0.202355 14.5998C0.312066 14.5265 0.531068 14.5265 0.969074 14.5265H1.47723Z"
      />
      <path
        className="pl-footer-emblem-part"
        d="M15.6403 27.4923C15.3306 27.802 15.1757 27.9569 15.0463 27.9826C14.8738 28.0169 14.6975 27.9439 14.5998 27.7976C14.5265 27.6879 14.5265 27.4689 14.5265 27.0309V26.5318C14.5265 22.8027 14.5264 20.938 15.1356 19.4672C15.9479 17.5061 17.506 15.948 19.4671 15.1356C20.9379 14.5264 22.8025 14.5265 26.5317 14.5265H27.0309C27.4689 14.5265 27.6879 14.5265 27.7976 14.5998C27.9439 14.6975 28.0169 14.8738 27.9826 15.0463C27.9569 15.1757 27.802 15.3306 27.4923 15.6403L15.6403 27.4923Z"
      />
      <path
        className="pl-footer-emblem-part"
        d="M27.5013 12.3687C27.811 12.6784 27.9659 12.8333 27.9916 12.9627C28.0259 13.1353 27.9529 13.3115 27.8067 13.4092C27.697 13.4825 27.478 13.4825 27.0399 13.4825H26.5317C22.8025 13.4825 20.9379 13.4825 19.4671 12.8733C17.506 12.061 15.9479 10.5029 15.1356 8.54182C14.5264 7.07101 14.5265 5.2064 14.5265 1.47723V0.969074C14.5265 0.531068 14.5265 0.312066 14.5998 0.202355C14.6975 0.0560741 14.8738 -0.0169249 15.0463 0.0173975C15.1757 0.0431393 15.3306 0.197998 15.6403 0.507714L27.5013 12.3687Z"
      />
      <path
        className="pl-footer-emblem-part"
        d="M13.4825 1.47723C13.4825 5.20639 13.4825 7.07101 12.8733 8.54182C12.061 10.5029 10.5029 12.061 8.54182 12.8733C7.07101 13.4825 5.2064 13.4825 1.47723 13.4825H0.960053C0.522048 13.4825 0.303045 13.4825 0.193335 13.4092C0.0470538 13.3115 -0.0259451 13.1353 0.00837721 12.9627C0.034119 12.8333 0.188977 12.6784 0.498694 12.3687L12.3687 0.498694C12.6784 0.188977 12.8333 0.034119 12.9627 0.00837721C13.1352 -0.0259451 13.3115 0.0470538 13.4092 0.193335C13.4825 0.303045 13.4825 0.522048 13.4825 0.960053V1.47723Z"
      />
    </svg>
  )
}

// X (formerly Twitter) wordmark logo, shown in place of the plain "X" label.
function XLogo() {
  return (
    <svg
      className="pl-footer-link-icon"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  )
}

// GitHub mark logo, shown in place of the plain "GitHub" label.
function GitHubLogo() {
  return (
    <svg
      className="pl-footer-link-icon pl-footer-link-icon-github"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

const FOOTER_ICONS = { github: GitHubLogo, x: XLogo }

function FooterLink({ link }) {
  const external = link.type === 'external'
  const Icon = link.icon ? FOOTER_ICONS[link.icon] : null
  return (
    <a
      href={external ? link.href : pathWithBase(link.href)}
      className={`pl-footer-link${Icon ? ' pl-footer-link-icon-only' : ''}`}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
    >
      {Icon ? (
        <>
          <Icon />
          <span className="pl-sr-only">{link.label}</span>
        </>
      ) : (
        link.label
      )}
      {external ? <span className="pl-sr-only"> opens in a new tab</span> : null}
    </a>
  )
}

export function PolarisFooter({ className = '' }) {
  return (
    <footer className={`pl-footer${className ? ` ${className}` : ''}`} aria-label="Footer">
      <div className="pl-footer-inner">
        <div className="pl-footer-top">
          <div className="pl-footer-identity">
            <PolarisFooterEmblem />
          </div>

          <nav className="pl-footer-links" aria-label="Polaris resources">
            {FOOTER_LINKS.map((link) => (
              <FooterLink key={link.href} link={link} />
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
