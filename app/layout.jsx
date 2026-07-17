import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { NavThemeSwitch } from '../components/NavThemeSwitch'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import { A11yEnhancements } from '../components/A11yEnhancements'
import { PolarisSearch } from '../components/PolarisSearch'
import { JsonLd } from './JsonLd'
import { buildGlobalJsonLd, metadataBase } from './seo.mjs'
import {
  absoluteUrl,
  markdownPathForRoute,
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  pathWithBase,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_TITLE_TEMPLATE
} from './site-config.mjs'
import 'nextra-theme-docs/style.css'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap'
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  // Headings render at 600 only (article h1/h2/h3 pin the weight), so the
  // 700 face was dead payload.
  weight: ['600'],
  variable: '--font-serif',
  display: 'swap'
})

export const metadata = {
  metadataBase: metadataBase(),
  title: {
    default: SITE_TITLE,
    template: SITE_TITLE_TEMPLATE
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: [
      { url: pathWithBase('/favicon.ico'), sizes: 'any' },
      { url: pathWithBase('/favicon.svg'), type: 'image/svg+xml' },
      { url: pathWithBase('/favicon.png'), type: 'image/png', sizes: '192x192' }
    ],
    shortcut: pathWithBase('/favicon.ico'),
    apple: [{ url: pathWithBase('/apple-touch-icon.png'), sizes: '180x180', type: 'image/png' }]
  },
  alternates: {
    canonical: pathWithBase('/'),
    types: {
      'text/markdown': [
        { url: pathWithBase(markdownPathForRoute('/')), title: 'Markdown: Polaris Documentation' },
        { url: pathWithBase('/llms.txt'), title: 'llms.txt' },
        { url: pathWithBase('/llms-full.txt'), title: 'llms-full.txt' }
      ],
      'application/json': [{ url: pathWithBase('/llms-index.json'), title: 'LLM docs index' }]
    }
  },
  applicationName: SITE_NAME,
  appleWebApp: { title: SITE_NAME },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: pathWithBase('/'),
    images: [
      {
        url: absoluteUrl(OG_IMAGE_PATH),
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: OG_IMAGE_ALT
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: absoluteUrl(OG_IMAGE_PATH),
        alt: OG_IMAGE_ALT
      }
    ]
  }
}

// Own anchor (not Nextra's auto logo link) so the accessible name comes from the
// visible "Polaris Docs" text — Nextra's hardcoded aria-label="Home page" would
// otherwise trip axe's label-content-name-mismatch.
const logo = (
  <a
    href={pathWithBase('/')}
    className="pl-logo-link"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.55rem',
      textDecoration: 'none',
      color: 'inherit'
    }}
  >
    <img
      src={pathWithBase('/emblem.svg')}
      alt=""
      className="pl-logo-mark"
      width={26}
      height={26}
      style={{ display: 'block' }}
    />
    <span
      className="pl-logo-text"
      style={{
        fontFamily: 'var(--font-serif), Georgia, serif',
        fontSize: '1.18rem',
        fontWeight: 600,
        letterSpacing: '0.04em'
      }}
    >
      Polaris <span style={{ opacity: 0.56, fontWeight: 600 }}>Docs</span>
    </span>
  </a>
)

const navbar = (
  <Navbar logo={logo} logoLink={false} aria-label="Primary">
    {/* Desktop-only: mobile keeps the theme switch in the sidebar sheet and
        hides these links to leave room for search (see globals.css). */}
    <span className="pl-nav-theme">
      <NavThemeSwitch />
    </span>
    <a
      href="https://polarisfinance.io"
      className="pl-nav-website"
      style={{ padding: '0.25rem 0.5rem' }}
      target="_blank"
      rel="noreferrer"
    >
      Website
    </a>
  </Navbar>
)

const footer = (
  <Footer>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <span style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '1.05rem' }}>
        The pETH-powered yield layer for all of DeFi
      </span>
      <span style={{ opacity: 0.9 }}>© {new Date().getFullYear()} Polaris</span>
      <span style={{ display: 'flex', gap: '1rem' }}>
        <a href={pathWithBase('/llms.txt')} className="pl-footer-llms">
          llms.txt
        </a>
        <a
          href="https://x.com/polarisfinance_"
          className="pl-footer-x"
          target="_blank"
          rel="noreferrer"
          aria-label="Polaris on X"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
      </span>
    </div>
  </Footer>
)

export default async function RootLayout({ children }) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${inter.variable} ${cormorant.variable}`}
    >
      <Head
        color={{ hue: 41, saturation: 42, lightness: { dark: 76, light: 37 } }}
        backgroundColor={{ dark: '#050a14', light: '#faf7f0' }}
      />
      <body>
        <JsonLd data={buildGlobalJsonLd()} />
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
          search={<PolarisSearch />}
          editLink={null}
          feedback={{ content: null }}
          sidebar={{ defaultMenuCollapseLevel: 1, toggleButton: false }}
          nextThemes={{ defaultTheme: 'dark' }}
        >
          {children}
        </Layout>
        <A11yEnhancements />
      </body>
    </html>
  )
}
