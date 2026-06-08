import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents as getMDXComponents } from '../../mdx-components'
import { JsonLd } from '../JsonLd'
import { buildPageJsonLd, buildPageMetadata } from '../seo.mjs'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

const searchVocabulary = [
  {
    match: /^\/$/,
    terms: ['app', 'official app', 'testnet', 'Testnet 2', 'Sepolia', 'pETH', 'pAssets']
  },
  {
    match: /^\/launch-status$/,
    terms: [
      'app',
      'official app',
      'testnet app',
      'app.testnet.polarisfinance.io',
      'testnet',
      'Testnet 2',
      'Sepolia',
      'chain ID 11155111',
      'WETH faucet',
      'contracts',
      'audits'
    ]
  },
  {
    match: /^\/getting-started$/,
    terms: [
      'app',
      'official app',
      'connect wallet',
      'testnet',
      'Sepolia',
      'Sepolia ETH',
      'WETH faucet',
      'borrow',
      'earn',
      'swap'
    ]
  },
  {
    match: /^\/paths$/,
    terms: ['Dashboard', 'Swap', 'Borrow', 'Earn', 'Split', 'Zap', 'Guide', 'Advanced', 'Analytics']
  },
  {
    match: /^\/paths\/safety-verification$/,
    terms: ['official app', 'app URL', 'phishing', 'verify contracts', 'testnet', 'mainnet']
  },
  {
    match:
      /^\/paths\/borrow-passets$|^\/minting\/(open-a-trove|minting-passets|managing-your-trove)$/,
    terms: ['Borrow', 'borrow', 'mint', 'open trove', 'pUSD', 'pGOLD', 'ICR', 'official app']
  },
  {
    match: /^\/paths\/earn-yield$|^\/yield\//,
    terms: ['Earn', 'earn', 'yield', 'APR', 'Stability Pool', 'deposit', 'claim rewards']
  },
  {
    match: /^\/peth\/(bonding-curve|floor-price)$|^\/paths\/hold-use-peth$/,
    terms: ['Swap', 'swap', 'Split', 'fpETH', 'vpETH', 'pETH', 'floor price']
  },
  {
    match: /^\/resources\/(glossary|contracts|faq)$/,
    terms: [
      'app',
      'official app',
      'testnet',
      'Sepolia',
      'WETH',
      'WETH faucet',
      'Zap',
      'Split',
      'Swap',
      'Borrow',
      'Earn',
      'Guide',
      'Advanced',
      'Analytics',
      'APR',
      'Reserve Loan'
    ]
  },
  {
    match: /^\/polar\/(participate-in-conversion|conversion-auctions|polar-token)$/,
    terms: ['POLAR', 'convert', 'lock', 'vePOLAR', 'burn pETH', 'conversion auction']
  }
]

function searchTermsForPath(path) {
  const terms = new Set()
  for (const entry of searchVocabulary) {
    if (entry.match.test(path)) {
      for (const term of entry.terms) terms.add(term)
    }
  }
  return [...terms]
}

function SearchBoost({ path }) {
  const terms = searchTermsForPath(path)
  if (!terms.length) return null

  return (
    <div
      aria-hidden="true"
      data-pagefind-weight="8"
      data-pagefind-meta="app_terms"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        clipPath: 'inset(50%)',
        whiteSpace: 'nowrap',
        border: 0
      }}
    >
      Search vocabulary: {terms.join(', ')}.
    </div>
  )
}

export async function generateMetadata(props) {
  const params = await props.params
  const { metadata } = await importPage(params.mdxPath)
  const path = params.mdxPath?.length ? `/${params.mdxPath.join('/')}` : '/'
  return buildPageMetadata(metadata, path)
}

const Wrapper = getMDXComponents().wrapper

export default async function Page(props) {
  const params = await props.params
  const { default: MDXContent, toc, metadata, sourceCode } = await importPage(params.mdxPath)
  const path = params.mdxPath?.length ? `/${params.mdxPath.join('/')}` : '/'
  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <SearchBoost path={path} />
      <JsonLd
        data={buildPageJsonLd({
          metadata,
          path,
          sourceCode
        })}
      />
      <MDXContent {...props} params={params} />
    </Wrapper>
  )
}
