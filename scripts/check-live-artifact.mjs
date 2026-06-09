import { BASE_PATH, SITE_BASE_URL } from '../app/site-config.mjs'

const args = process.argv.slice(2)
const baseUrlArg = args.find((arg) => arg.startsWith('--base-url='))
const baseUrlValue = baseUrlArg?.split('=')[1] ?? args[args.indexOf('--base-url') + 1]
const baseUrl = normalizeBaseUrl(
  baseUrlValue ?? process.env.LIVE_ARTIFACT_BASE_URL ?? SITE_BASE_URL
)
const expectedBaseUrl = normalizeBaseUrl(
  process.env.LIVE_ARTIFACT_EXPECTED_BASE_URL ?? SITE_BASE_URL
)
const failures = []
const staleCustomHost = 'docs.polarisfinance.io'

function normalizeBaseUrl(value) {
  const trimmed = value.trim().replace(/\/+$/, '')
  if (!trimmed) return SITE_BASE_URL
  return trimmed
}

function siteUrl(pathname = '/') {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  if (path === '/') return baseUrl
  return `${baseUrl}${path}`
}

async function fetchText(url, expected) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'polaris-docs-live-smoke/1.0' }
  })
  const contentType = response.headers.get('content-type') ?? ''

  if (response.status !== expected.status) {
    failures.push(`${url} returned ${response.status}; expected ${expected.status}`)
  }

  if (expected.mime && !expected.mime.some((mime) => contentType.includes(mime))) {
    failures.push(`${url} returned MIME ${contentType || '(missing)'}; expected ${expected.mime}`)
  }

  const body = await response.text()
  if (body.includes(staleCustomHost)) {
    failures.push(`${url} contains stale custom-domain reference ${staleCustomHost}`)
  }

  return { body, contentType, response }
}

async function fetchHeadOrGet(url, expected) {
  let response = await fetch(url, {
    method: 'HEAD',
    redirect: 'follow',
    headers: { 'user-agent': 'polaris-docs-live-smoke/1.0' }
  })

  if (response.status === 405 || response.status === 403) {
    response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'user-agent': 'polaris-docs-live-smoke/1.0' }
    })
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (response.status !== expected.status) {
    failures.push(`${url} returned ${response.status}; expected ${expected.status}`)
  }
  if (expected.mime && !expected.mime.some((mime) => contentType.includes(mime))) {
    failures.push(`${url} returned MIME ${contentType || '(missing)'}; expected ${expected.mime}`)
  }
}

function attributeValues(html) {
  return [...html.matchAll(/\s(?:href|src)=["']([^"']+)["']/g)].map((match) => match[1])
}

function absoluteResourceUrl(value) {
  if (/^https?:\/\//.test(value)) return value
  if (!value.startsWith('/')) return new URL(value, `${baseUrl}/`).toString()
  const origin = new URL(baseUrl).origin
  return `${origin}${value}`
}

function assertProjectScopedAttributes(html, url) {
  if (!BASE_PATH) return

  for (const value of attributeValues(html)) {
    if (!value.startsWith('/')) continue
    if (value === BASE_PATH || value.startsWith(`${BASE_PATH}/`)) continue
    failures.push(`${url} contains root-scoped asset or route reference: ${value}`)
  }
}

function assertHtmlMetadata(html, url, canonicalUrl) {
  const canonical = /<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i.exec(html)?.[1]
  const ogUrl = /<meta\s+property=["']og:url["'][^>]*content=["']([^"']+)["']/i.exec(html)?.[1]

  if (canonical !== canonicalUrl) {
    failures.push(
      `${url} canonical mismatch: expected ${canonicalUrl}, found ${canonical ?? '(missing)'}`
    )
  }

  if (ogUrl && ogUrl !== canonicalUrl) {
    failures.push(`${url} og:url mismatch: expected ${canonicalUrl}, found ${ogUrl}`)
  }
}

function pickResources(html) {
  const values = attributeValues(html)
  const css = values.find((value) => value.includes('/_next/') && value.endsWith('.css'))
  const js = values.find((value) => value.includes('/_next/') && value.endsWith('.js'))
  return [
    css && { url: absoluteResourceUrl(css), mime: ['text/css'] },
    js && {
      url: absoluteResourceUrl(js),
      mime: ['application/javascript', 'text/javascript']
    },
    { url: siteUrl('/_pagefind/pagefind.js'), mime: ['application/javascript', 'text/javascript'] },
    { url: siteUrl('/emblem.svg'), mime: ['image/svg+xml'] },
    { url: siteUrl('/og-image.png'), mime: ['image/png'] }
  ].filter(Boolean)
}

const home = await fetchText(siteUrl('/'), { status: 200, mime: ['text/html'] })
assertProjectScopedAttributes(home.body, siteUrl('/'))
assertHtmlMetadata(home.body, siteUrl('/'), `${expectedBaseUrl}/`)

const launchStatusUrl = siteUrl('/launch-status')
const launchStatus = await fetchText(launchStatusUrl, { status: 200, mime: ['text/html'] })
assertProjectScopedAttributes(launchStatus.body, launchStatusUrl)
assertHtmlMetadata(launchStatus.body, launchStatusUrl, `${expectedBaseUrl}/launch-status`)

const robotsUrl = siteUrl('/robots.txt')
const robots = await fetchText(robotsUrl, { status: 200, mime: ['text/plain'] })
const expectedSitemapLine = `Sitemap: ${expectedBaseUrl}/sitemap.xml`
if (!robots.body.includes(expectedSitemapLine)) {
  failures.push(`${robotsUrl} does not include ${expectedSitemapLine}`)
}
for (const agent of ['OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'ClaudeBot', 'PerplexityBot']) {
  if (!robots.body.includes(`User-agent: ${agent}`)) {
    failures.push(`${robotsUrl} does not explicitly mention ${agent}`)
  }
}

const sitemapUrl = siteUrl('/sitemap.xml')
const sitemap = await fetchText(sitemapUrl, {
  status: 200,
  mime: ['application/xml', 'text/xml', 'text/plain']
})
const sitemapLocations = [...sitemap.body.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
if (!sitemapLocations.length) failures.push(`${sitemapUrl} has no <loc> entries`)
for (const loc of sitemapLocations) {
  if (!loc.startsWith(expectedBaseUrl)) {
    failures.push(`${sitemapUrl} contains out-of-base location: ${loc}`)
  }
}

const llmsUrl = siteUrl('/llms.txt')
const llms = await fetchText(llmsUrl, { status: 200, mime: ['text/plain'] })
if (!llms.body.includes(expectedBaseUrl)) {
  failures.push(`${llmsUrl} does not include ${expectedBaseUrl}`)
}

await fetchText(siteUrl('/.well-known/llms.txt'), { status: 200, mime: ['text/plain'] })
await fetchText(siteUrl('/llms-full.txt'), { status: 200, mime: ['text/plain'] })
await fetchText(siteUrl('/.well-known/llms-full.txt'), { status: 200, mime: ['text/plain'] })

const llmsIndexUrl = siteUrl('/llms-index.json')
const llmsIndex = await fetchText(llmsIndexUrl, { status: 200, mime: ['application/json'] })
let firstMarkdownUrl = ''
try {
  const parsed = JSON.parse(llmsIndex.body)
  if (parsed.site !== `${expectedBaseUrl}/`) {
    failures.push(
      `${llmsIndexUrl} site mismatch: expected ${expectedBaseUrl}/, found ${parsed.site}`
    )
  }
  if (!Array.isArray(parsed.pages) || parsed.pages.length === 0) {
    failures.push(`${llmsIndexUrl} has no pages`)
  } else {
    firstMarkdownUrl = parsed.pages[0]?.markdownUrl ?? ''
    for (const page of parsed.pages) {
      if (typeof page.url !== 'string' || !page.url.startsWith(expectedBaseUrl)) {
        failures.push(`${llmsIndexUrl} contains out-of-base page URL: ${page.url}`)
      }
      if (typeof page.markdownUrl !== 'string' || !page.markdownUrl.startsWith(expectedBaseUrl)) {
        failures.push(`${llmsIndexUrl} contains out-of-base markdown URL: ${page.markdownUrl}`)
      }
    }
  }
} catch (error) {
  failures.push(`${llmsIndexUrl} is invalid JSON: ${error.message}`)
}

if (firstMarkdownUrl) {
  await fetchText(firstMarkdownUrl.replace(expectedBaseUrl, baseUrl), {
    status: 200,
    mime: ['text/markdown', 'text/plain', 'application/octet-stream']
  })
}

const manifestUrl = siteUrl('/polaris-testnet-manifest.json')
const manifest = await fetchText(manifestUrl, { status: 200, mime: ['application/json'] })
try {
  const parsed = JSON.parse(manifest.body)
  if (parsed.site !== `${expectedBaseUrl}/`) {
    failures.push(
      `${manifestUrl} site mismatch: expected ${expectedBaseUrl}/, found ${parsed.site}`
    )
  }
  if (parsed.environment?.chainId !== 11155111) {
    failures.push(`${manifestUrl} has unexpected testnet chain ID`)
  }
  if (!Array.isArray(parsed.contracts?.entries) || parsed.contracts.entries.length === 0) {
    failures.push(`${manifestUrl} has no contract entries`)
  }
} catch (error) {
  failures.push(`${manifestUrl} is invalid JSON: ${error.message}`)
}

for (const resource of pickResources(home.body)) {
  await fetchHeadOrGet(resource.url, { status: 200, mime: resource.mime })
}

if (failures.length) {
  console.error('Live artifact smoke check failed:\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Live artifact smoke check passed for ${baseUrl} advertising ${expectedBaseUrl}.`)
