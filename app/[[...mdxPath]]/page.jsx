import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents as getMDXComponents } from '../../mdx-components'
import { JsonLd } from '../JsonLd'
import { kindForPath, sectionForPath } from '../search-taxonomy.mjs'
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
    match: /^\/using-app\/borrow$|^\/minting\/(open-a-trove|managing-your-trove)$/,
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
      'LTV',
      'loan-to-value',
      'official app'
    ]
  },
  {
    match: /^\/minting\/(open-a-trove|managing-your-trove)$/,
    terms: ['trove', 'open trove', 'manage trove', 'borrower trove'],
    priorityTerms: ['trove', 'open trove', 'manage trove', 'borrow', 'CDP']
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
    match: /^\/peth(\/.*)?$/,
    terms: ['pETH', 'pETH bonding curve', 'bonding curve', 'pETH floor'],
    priorityTerms: ['pETH', 'pETH bonding curve', 'bonding curve', 'pETH floor']
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
    match: /^\/polar(\/tokenomics)?$/,
    terms: ['POLAR token', 'POLAR staking', 'POLAR tokenomics'],
    priorityTerms: ['POLAR', 'POLAR token', 'POLAR staking', 'staking POLAR', 'vePOLAR']
  },
  {
    match: /^\/redemptions-liquidations\/liquidations$/,
    terms: ['liquidation', 'liquidations', 'liquidate', 'liquidated', 'liquidation penalty'],
    priorityTerms: ['liquidation', 'liquidations', 'liquidate', 'liquidated']
  },
  {
    match: /^\/resources\/risk-disclosure$/,
    terms: ['risk', 'risks', 'risk disclosure', 'smart contract risk', 'liquidation risk'],
    priorityTerms: ['risk', 'risks', 'risk disclosure']
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
  const priorityTerms = new Set()
  for (const entry of searchVocabulary) {
    if (entry.match.test(path)) {
      for (const term of entry.terms) terms.add(term)
      for (const term of entry.priorityTerms ?? []) priorityTerms.add(term)
    }
  }
  return {
    terms: [...terms],
    priorityTerms: [...priorityTerms]
  }
}

const srOnly = {
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
}

// Pagefind-only signals for every page. `section`/`kind` travel with each result
// so the search panel can show where a hit lives and color-code its type without
// re-deriving anything client-side; `section` is also the filter facet. Curated
// synonyms are indexed but heavily down-weighted so they help recall without
// outranking real prose or dominating excerpts. None of this is visible or read
// by assistive tech.
function SearchMeta({ path }) {
  const section = sectionForPath(path)
  const kind = kindForPath(path)
  const { terms, priorityTerms } = searchTermsForPath(path)

  return (
    <>
      <span
        style={srOnly}
        data-pagefind-meta={`section:${section}`}
        data-pagefind-filter={`section:${section}`}
      />
      <span style={srOnly} data-pagefind-meta={`kind:${kind}`} />
      {priorityTerms.length ? (
        <span aria-hidden="true" style={srOnly} data-pagefind-weight="2">
          {priorityTerms.join(' ')}
        </span>
      ) : null}
      {terms.length ? (
        <span aria-hidden="true" style={srOnly} data-pagefind-weight="0.1">
          {terms.join(' ')}
        </span>
      ) : null}
    </>
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
      <SearchMeta path={path} />
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
