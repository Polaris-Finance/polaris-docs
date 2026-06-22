// Curated Pagefind search synonyms per route. Indexed but heavily down-weighted
// so they aid recall without outranking real prose. Consumed by the page shell
// (app/[[...mdxPath]]/page.jsx) and by scripts/generate-llms.mjs for the
// machine-readable llms*.txt vocabulary lines — import it, never regex it out.
export const searchVocabulary = [
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
    match: /^\/using-app\/issue$|^\/minting\/manage-position$/,
    terms: [
      'Issue',
      'Manage Position',
      'borrow',
      'issue',
      'trove',
      'troves',
      'open trove',
      'manage trove',
      'collateralized debt position',
      'CDP',
      'open borrow position',
      'repay',
      'close borrow position',
      'USDp',
      'GOLDp',
      'LTV',
      'loan-to-value',
      'official app'
    ]
  },
  {
    match: /^\/minting\/manage-position$/,
    terms: [
      'borrow position',
      'open borrow position',
      'manage borrow position',
      'pAsset debt position',
      'trove',
      'troves',
      'open trove',
      'manage trove'
    ],
    priorityTerms: [
      'borrow position',
      'open borrow position',
      'manage borrow position',
      'borrow',
      'collateral position',
      'trove',
      'open trove',
      'manage trove'
    ]
  },
  {
    match: /^\/using-app\/(earn|zap)$|^\/yield(\/.*)?$/,
    terms: ['Earn', 'earn', 'yield', 'APR', 'Earn Vault', 'deposit', 'claim rewards']
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
    match: /^\/resources$|^\/resources\/(testnet|faq)$/,
    terms: [
      'app',
      'official app',
      'app URL',
      'phishing',
      'verify contracts',
      'testnet',
      'mainnet',
      'Sepolia',
      'WETH',
      'WETH faucet',
      'Zap',
      'Split',
      'Swap',
      'Issue',
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

export function searchTermsForPath(path) {
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
