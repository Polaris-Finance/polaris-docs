const DEFAULT_SITE_URL = 'https://tokenbrice.github.io'
const DEFAULT_BASE_PATH = '/polaris-docs'

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '')
}

function normalizeBasePath(value = '') {
  const trimmed = trimTrailingSlash(value.trim())
  if (!trimmed || trimmed === '/') return ''
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

function normalizeSiteUrl(value = DEFAULT_SITE_URL) {
  const trimmed = trimTrailingSlash(value.trim())
  return trimmed || DEFAULT_SITE_URL
}

export const SITE_URL = normalizeSiteUrl(
  process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL
)
export const BASE_PATH = normalizeBasePath(
  process.env.BASE_PATH ?? process.env.NEXT_PUBLIC_BASE_PATH ?? DEFAULT_BASE_PATH
)
export const SITE_BASE_URL = `${SITE_URL}${BASE_PATH}`

export const SITE_NAME = 'Polaris Docs'
export const SITE_TITLE = 'Polaris Documentation'
export const SITE_TITLE_TEMPLATE = '%s — Polaris Docs'
export const SITE_DESCRIPTION =
  'User documentation for Polaris Finance — the pETH-powered yield layer for all of DeFi. Mint pAssets backed entirely by onchain collateral and yield.'

export const ORGANIZATION_NAME = 'Polaris Finance'
export const OG_IMAGE_PATH = '/og-image.png'
export const OG_IMAGE_ALT =
  'Polaris Finance documentation for pETH, pAssets, minting, yield, and stewardship.'
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

export const SEARCH_URL_TEMPLATE =
  process.env.SITE_SEARCH_URL_TEMPLATE ?? process.env.NEXT_PUBLIC_SITE_SEARCH_URL_TEMPLATE ?? ''

export function pathWithBase(pathname = '/') {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  if (path === '/') return BASE_PATH ? `${BASE_PATH}/` : '/'
  return `${BASE_PATH}${path}`
}

export function isExternalHref(href) {
  return typeof href === 'string' && /^https?:\/\//.test(href)
}

export function isHashHref(href) {
  return typeof href === 'string' && href.startsWith('#')
}

export function hrefWithBase(href) {
  if (typeof href !== 'string') return href
  if (
    isHashHref(href) ||
    isExternalHref(href) ||
    /^(?:mailto:|tel:|data:|blob:|javascript:)/.test(href) ||
    href.startsWith('//')
  ) {
    return href
  }
  if (href.startsWith(pathWithBase('/'))) return href
  if (href.startsWith('/')) return pathWithBase(href)
  return href
}

export function absoluteUrl(pathname = '/') {
  return `${SITE_URL}${pathWithBase(pathname)}`
}
