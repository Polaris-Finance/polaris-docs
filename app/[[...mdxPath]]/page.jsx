import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents as getMDXComponents } from '../../mdx-components'
import { JsonLd } from '../JsonLd'
import { buildPageJsonLd, buildPageMetadata } from '../seo.mjs'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

const searchVocabulary = [
  {
    match: /^\/$/,
    terms: ['app', 'official app', 'testnet', 'Public Testnet 1', 'Sepolia', 'pETH', 'pAssets']
  },
  {
    match: /^\/launch-status$/,
    terms: [
      'app',
      'official app',
      'testnet app',
      'app.testnet.polarisfinance.io',
      'connect wallet',
      'testnet',
      'Public Testnet 1',
      'Sepolia',
      'Sepolia ETH',
      'chain ID 11155111',
      'WETH faucet',
      'borrow',
      'earn',
      'swap',
      'contracts',
      'audits'
    ]
  },
  {
    match: /^\/resources\/safety-verification$/,
    terms: ['official app', 'app URL', 'phishing', 'verify contracts', 'testnet', 'mainnet']
  },
  {
    match: /^\/using-app\/(borrow|manage-trove)$|^\/minting\/(open-a-trove|managing-your-trove)$/,
    terms: [
      'Borrow',
      'Manage Trove',
      'borrow',
      'mint',
      'open trove',
      'repay',
      'close trove',
      'pUSD',
      'pGOLD',
      'ICR',
      'official app'
    ]
  },
  {
    match: /^\/using-app\/(earn|zap)$|^\/yield(\/.*)?$/,
    terms: ['Earn', 'earn', 'yield', 'APR', 'Stability Pool', 'deposit', 'claim rewards']
  },
  {
    match: /^\/using-app\/(swap|split)$|^\/peth(\/.*)?$/,
    terms: ['Swap', 'swap', 'Split', 'fpETH', 'vpETH', 'pETH', 'floor price']
  },
  {
    match: /^\/resources$|^\/resources\/(contracts|parameters|testnet|faq)$/,
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
    match: /^\/polar(\/(conversion-auctions|tokenomics))?$/,
    terms: ['POLAR', 'convert', 'lock', 'vePOLAR', 'burn pETH', 'conversion auction']
  },
  {
    match: /^\/quickstart$|^\/troubleshooting$/,
    terms: [
      'quickstart',
      'troubleshooting',
      'wrong network',
      'Sepolia',
      'faucet',
      'approval',
      'stale quote',
      'failed transaction'
    ]
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
