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
export const SITE_TITLE_TEMPLATE = '%s - Polaris Docs'
export const SITE_DESCRIPTION =
  'User documentation for Polaris, the pETH-powered yield layer for DeFi. Issue pAssets backed entirely by onchain collateral and yield.'

export const ORGANIZATION_NAME = 'Polaris'
export const OG_IMAGE_PATH = '/og-image.png'
export const OG_IMAGE_ALT =
  'Polaris documentation for pETH, pAssets, issuing, yield, and stewardship.'
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

// Map a route prefix to a section-specific OG image. Longest matching prefix
// wins. Start empty (every route falls back to OG_IMAGE_PATH); add entries
// only once the corresponding image binaries exist under public/.
export const OG_IMAGE_SECTIONS = {}

export function ogImagePathForRoute(pathname = '/') {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  let matched = OG_IMAGE_PATH
  let matchedLength = -1
  for (const [prefix, image] of Object.entries(OG_IMAGE_SECTIONS)) {
    const isMatch = path === prefix || path.startsWith(`${prefix}/`)
    if (isMatch && prefix.length > matchedLength) {
      matched = image
      matchedLength = prefix.length
    }
  }
  return matched
}

export const SEARCH_URL_TEMPLATE =
  process.env.SITE_SEARCH_URL_TEMPLATE ?? process.env.NEXT_PUBLIC_SITE_SEARCH_URL_TEMPLATE ?? ''

export function pathWithBase(pathname = '/') {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  if (path === '/') return BASE_PATH ? `${BASE_PATH}/` : '/'
  return `${BASE_PATH}${path}`
}

export function markdownPathForRoute(pathname = '/') {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  if (path === '/') return '/index.md'
  return `${path.replace(/\/$/, '')}.md`
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
