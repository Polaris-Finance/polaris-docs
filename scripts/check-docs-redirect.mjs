import { SITE_BASE_URL } from '../app/site-config.mjs'

const sourceBaseUrl = normalizeBaseUrl(
  process.env.DOCS_REDIRECT_SOURCE_URL ?? 'https://polaris.finance/docs'
)
const targetBaseUrl = normalizeBaseUrl(process.env.DOCS_REDIRECT_TARGET_URL ?? SITE_BASE_URL)
const redirectStatuses = new Set([301, 302, 307, 308])
const permanentStatuses = new Set([301, 308])
const failures = []
const warnings = []

function normalizeBaseUrl(value) {
  return value.trim().replace(/\/+$/, '')
}

function urlAt(baseUrl, pathname, search = '') {
  const path = pathname === '/' ? '/' : `/${pathname.replace(/^\/+/, '')}`
  return `${baseUrl}${path}${search}`
}

async function assertRedirectUrl(sourceUrl, expectedTarget) {
  const response = await fetch(sourceUrl, {
    redirect: 'manual',
    headers: { 'user-agent': 'polaris-docs-redirect-check/1.0' }
  })
  const location = response.headers.get('location')

  if (!redirectStatuses.has(response.status)) {
    failures.push(`${sourceUrl} returned ${response.status}; expected an HTTP redirect`)
    return
  }

  if (!permanentStatuses.has(response.status)) {
    warnings.push(`${sourceUrl} uses temporary status ${response.status}; use 301 or 308`)
  }

  if (!location) {
    failures.push(`${sourceUrl} returned ${response.status} without a Location header`)
    return
  }

  const actualTarget = new URL(location, sourceUrl).toString()
  if (actualTarget !== expectedTarget) {
    failures.push(`${sourceUrl} redirects to ${actualTarget}; expected ${expectedTarget}`)
  }
}

async function assertRedirect(pathname, search = '') {
  await assertRedirectUrl(
    urlAt(sourceBaseUrl, pathname, search),
    urlAt(targetBaseUrl, pathname, search)
  )
}

await assertRedirectUrl(sourceBaseUrl, targetBaseUrl)
await assertRedirect('/')
await assertRedirect('/core-assets/peth', '?redirect_check=1')

for (const warning of warnings) {
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.warn(`::warning title=Temporary docs redirect::${warning}`)
  } else {
    console.warn(`Warning: ${warning}`)
  }
}

if (failures.length) {
  console.error('Docs redirect check failed:\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  `Docs redirect check passed (${sourceBaseUrl} -> ${targetBaseUrl})${
    warnings.length ? ` with ${warnings.length} warning(s)` : ''
  }.`
)
