'use client'

import { useEffect } from 'react'
import { BASE_PATH, pathWithBase } from '../app/site-config.mjs'

// Routes deleted by the July 2026 rewrite (2931a3f) and later IA changes,
// mapped to the page that now carries their subject. The exported 404 page
// runs this client-side so old links and bookmarks recover instead of
// dead-ending; the query string and fragment survive the hop.
const LEGACY_REDIRECTS = {
  '/architecture/steward-responsibilities': '/architecture/stewardship',
  '/developers': '/',
  '/manifesto': '/overview/manifesto',
  '/why-peth': '/overview/why-peth',
  '/vision': '/overview/vision',
  '/risks/risks-polaris-removes': '/risks/security-properties',
  '/testnet/zap': '/testnet/swap',
  '/launch-status': '/testnet/dashboard',
  '/quickstart': '/testnet/dashboard',
  '/troubleshooting': '/testnet/advanced',
  '/why-polaris': '/why-peth',
  '/peth': '/core-assets/peth',
  '/peth/floor-price': '/core-assets/peth',
  '/peth/split': '/core-assets/fpeth',
  '/minting': '/architecture/passet-markets',
  '/minting/pusd': '/core-assets/usdp',
  '/minting/pgold': '/core-assets/goldp',
  '/minting/interest-rates': '/design/interest-rates',
  '/minting/manage-position': '/testnet/mint',
  '/minting/passet-catalog': '/architecture/passet-markets',
  '/minting/launch-a-passet': '/architecture/passet-markets',
  '/polar': '/core-assets/polar',
  '/polar/tokenomics': '/architecture/tokenomics',
  '/polar/conversion-auctions': '/design/conversions',
  '/redemptions-liquidations': '/design/adaptive-peg-defence',
  '/redemptions-liquidations/liquidations': '/design/liquidations',
  '/redemptions-liquidations/recovery-mode': '/design/recovery-mode',
  '/resources': '/',
  '/resources/faq': '/',
  '/resources/audits-security': '/risks',
  '/resources/risk-disclosure': '/risks',
  '/resources/testnet': '/testnet/dashboard',
  '/stewardship': '/architecture/stewardship',
  '/stewardship/fee-router': '/design/fee-router',
  '/stewardship/vepolar': '/architecture/stewardship',
  '/using-app': '/testnet/dashboard',
  '/using-app/issue': '/testnet/mint',
  '/using-app/earn': '/testnet/earn',
  '/using-app/split': '/testnet/split',
  '/using-app/swap': '/testnet/swap',
  '/using-app/zap': '/testnet/zap',
  '/using-app/advanced': '/testnet/advanced',
  '/yield': '/architecture/earn-vaults',
  '/yield/yield-sources': '/design/revenue-model',
  '/yield/strategies': '/architecture/earn-vaults'
}

export function LegacyRedirect() {
  useEffect(() => {
    let route = location.pathname
    if (BASE_PATH && route.startsWith(BASE_PATH)) route = route.slice(BASE_PATH.length)
    route = route.replace(/\/+$/, '') || '/'
    const target = LEGACY_REDIRECTS[route]
    if (target) location.replace(pathWithBase(target) + location.search + location.hash)
  }, [])

  return null
}
