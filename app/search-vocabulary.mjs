// Curated Pagefind search synonyms per route. Indexed but heavily down-weighted
// so they aid recall without outranking real prose. Consumed by the page shell
// (app/[[...mdxPath]]/page.jsx) and by scripts/generate-llms.mjs for the
// machine-readable llms*.txt vocabulary lines — import it, never regex it out.
export const searchVocabulary = [
  {
    match: /^\/(?:polaris-101)?$/,
    terms: ['app', 'official app', 'testnet', 'Sepolia', 'pETH', 'pAssets', 'USDp']
  },
  {
    match: /^\/testnet(\/|$)/,
    terms: [
      'app',
      'official app',
      'testnet app',
      'app.testnet.polarisfinance.io',
      'connect wallet',
      'testnet',
      'Sepolia',
      'Sepolia ETH',
      'chain ID 11155111',
      'faucet'
    ]
  },
  {
    match: /^\/testnet\/mint$/,
    terms: [
      'Mint',
      'borrow',
      'issue',
      'trove',
      'troves',
      'open trove',
      'manage trove',
      'collateralized debt position',
      'CDP',
      'open borrow position',
      'manage position',
      'repay',
      'close borrow position',
      'USDp',
      'GOLDp',
      'LTV',
      'loan-to-value'
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
    match: /^\/testnet\/earn$|^\/architecture\/earn-vaults$/,
    terms: [
      'Earn',
      'earn',
      'yield',
      'APR',
      'Earn Vault',
      'deposit',
      'claim rewards',
      'sUSDp',
      'sGOLDp'
    ]
  },
  {
    match: /^\/testnet\/(swap|split)$|^\/core-assets\/(peth|fpeth|vpeth)$/,
    terms: ['Swap', 'swap', 'Split', 'fpETH', 'vpETH', 'pETH', 'floor price']
  },
  {
    match: /^\/core-assets\/peth$|^\/architecture\/bonding-curve$/,
    terms: ['pETH', 'pETH bonding curve', 'bonding curve', 'pETH floor'],
    priorityTerms: ['pETH', 'pETH bonding curve', 'bonding curve', 'pETH floor']
  },
  {
    match: /^\/core-assets\/polar$|^\/architecture\/tokenomics$|^\/design\/conversions$/,
    terms: ['POLAR', 'convert', 'lock', 'vePOLAR', 'burn pETH', 'conversion auction']
  },
  {
    match: /^\/core-assets\/polar$|^\/architecture\/tokenomics$/,
    terms: ['POLAR token', 'POLAR staking', 'POLAR tokenomics'],
    priorityTerms: ['POLAR', 'POLAR token', 'POLAR staking', 'staking POLAR', 'vePOLAR']
  },
  {
    match: /^\/architecture\/reserve-loans$|^\/testnet\/reserve-loan$/,
    terms: ['Reserve Loan', 'Reserve Loans', 'borrow ETH', 'non-liquidatable', 'fpETH collateral']
  },
  {
    match: /^\/design\/liquidations$/,
    terms: ['liquidation', 'liquidations', 'liquidate', 'liquidated', 'liquidation penalty'],
    priorityTerms: ['liquidation', 'liquidations', 'liquidate', 'liquidated']
  },
  {
    match: /^\/design\/oracles$/,
    terms: ['oracle', 'oracles', 'Medianiser', 'price feed', 'ETH/USD', 'XAU/USD']
  },
  {
    match: /^\/testnet\/advanced$/,
    terms: ['Peg Stability Module', 'PSM', 'redeem', 'convert pETH to POLAR', 'arbitrage']
  },
  {
    match: /^\/risks(\/|$)/,
    terms: ['risk', 'risks', 'risk disclosure', 'smart contract risk', 'liquidation risk'],
    priorityTerms: ['risk', 'risks', 'risk disclosure']
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
