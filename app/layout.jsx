import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import Image from 'next/image'
import { A11yEnhancements } from '../components/A11yEnhancements'
import { SearchPanelFix } from '../components/SearchPanelFix'
import 'nextra-theme-docs/style.css'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap'
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap'
})

export const metadata = {
  metadataBase: new URL('https://docs.polarisfinance.io'),
  title: {
    default: 'Polaris Documentation',
    template: '%s — Polaris Docs'
  },
  description:
    'User documentation for Polaris Finance — the pETH-powered yield layer for all of DeFi. Mint pAssets backed entirely by onchain collateral and yield. No T-bills. No CEXs. No compromises.',
  alternates: {
    canonical: '/'
  },
  applicationName: 'Polaris Docs',
  appleWebApp: { title: 'Polaris Docs' },
  openGraph: {
    type: 'website',
    siteName: 'Polaris Docs',
    title: 'Polaris Documentation',
    description:
      'User documentation for Polaris Finance — the pETH-powered yield layer for all of DeFi. Mint pAssets backed entirely by onchain collateral and yield.',
    url: '/',
    images: ['/og-image.png']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Polaris Documentation',
    description:
      'User documentation for Polaris Finance — the pETH-powered yield layer for all of DeFi. Mint pAssets backed entirely by onchain collateral and yield.',
    images: ['/og-image.png']
  }
}

// Own anchor (not Nextra's auto logo link) so the accessible name comes from the
// visible "Polaris Docs" text — Nextra's hardcoded aria-label="Home page" would
// otherwise trip axe's label-content-name-mismatch.
const logo = (
  <a
    href="/"
    className="pl-logo-link"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.55rem',
      textDecoration: 'none',
      color: 'inherit'
    }}
  >
    <Image src="/emblem.svg" alt="" width={26} height={26} style={{ display: 'block' }} unoptimized />
    <span
      style={{
        fontFamily: 'var(--font-serif), Georgia, serif',
        fontSize: '1.18rem',
        fontWeight: 600,
        letterSpacing: '0.04em'
      }}
    >
      Polaris <span style={{ opacity: 0.6, fontWeight: 400 }}>Docs</span>
    </span>
  </a>
)

const navbar = (
  <Navbar logo={logo} logoLink={false}>
    <a href="https://polarisfinance.io" style={{ padding: '0.25rem 0.5rem' }} target="_blank" rel="noreferrer">
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
      <span style={{ opacity: 0.9 }}>
        © {new Date().getFullYear()} Polaris Finance · No T-bills. No CEXs. No compromises.
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
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
          editLink={null}
          feedback={{ content: null }}
          sidebar={{ defaultMenuCollapseLevel: 1, toggleButton: true }}
          nextThemes={{ defaultTheme: 'dark' }}
        >
          {children}
        </Layout>
        <A11yEnhancements />
        <SearchPanelFix />
      </body>
    </html>
  )
}
