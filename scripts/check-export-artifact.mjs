import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { absoluteUrl, BASE_PATH, SITE_BASE_URL, SITE_URL } from '../app/site-config.mjs'

const root = process.cwd()
const outDir = path.join(root, 'out')
const failures = []
const staleCustomHost = 'docs.polarisfinance.io'
const expectedHost = new URL(SITE_URL).host

function walk(dir) {
  const entries = []
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) entries.push(...walk(fullPath))
    else entries.push(fullPath)
  }
  return entries
}

function readOut(relativePath) {
  const fullPath = path.join(outDir, relativePath)
  if (!existsSync(fullPath)) {
    failures.push(`out/${relativePath} is missing`)
    return ''
  }
  return readFileSync(fullPath, 'utf8')
}

function relativeOut(file) {
  return path.relative(outDir, file).replace(/\\/g, '/')
}

function isSpecialHtml(relativePath) {
  return (
    relativePath === '404.html' ||
    relativePath === '_not-found.html' ||
    relativePath.startsWith('_not-found/')
  )
}

function routeForHtml(file) {
  const relativePath = relativeOut(file)
  if (isSpecialHtml(relativePath)) return null
  if (relativePath === 'index.html') return '/'
  if (relativePath.endsWith('/index.html')) {
    return `/${relativePath.slice(0, -'/index.html'.length)}`
  }
  if (relativePath.endsWith('.html')) return `/${relativePath.slice(0, -'.html'.length)}`
  return null
}

function stripHashAndQuery(value) {
  return value.split('#')[0].split('?')[0]
}

function isIgnorableReference(value) {
  return (
    !value ||
    value.startsWith('#') ||
    value.startsWith('mailto:') ||
    value.startsWith('tel:') ||
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('javascript:')
  )
}

function outPathForPublicPath(publicPath) {
  const cleanPath = decodeURIComponent(stripHashAndQuery(publicPath))
  if (!cleanPath || cleanPath === '/') return 'index.html'

  let pathWithoutBase = cleanPath
  if (BASE_PATH) {
    if (pathWithoutBase === BASE_PATH) return 'index.html'
    if (!pathWithoutBase.startsWith(`${BASE_PATH}/`)) return null
    pathWithoutBase = pathWithoutBase.slice(BASE_PATH.length)
  }

  const normalized = pathWithoutBase.replace(/^\/+/, '')
  if (!normalized) return 'index.html'

  if (path.extname(normalized)) return normalized
  if (existsSync(path.join(outDir, `${normalized}.html`))) return `${normalized}.html`
  if (existsSync(path.join(outDir, normalized, 'index.html'))) return `${normalized}/index.html`
  return `${normalized}.html`
}

function assertOutReferenceExists(relativeFile, value) {
  if (isIgnorableReference(value)) return

  let pathname = value
  if (/^https?:\/\//.test(value)) {
    const parsed = new URL(value)
    if (parsed.host !== expectedHost) return
    pathname = parsed.pathname
  } else if (!value.startsWith('/')) {
    return
  }

  const outPath = outPathForPublicPath(pathname)
  if (!outPath) return
  if (!existsSync(path.join(outDir, outPath))) {
    failures.push(`${relativeFile} references missing exported file: ${value}`)
  }
}

function extractAttributeValues(html) {
  return [...html.matchAll(/\s(?:href|src|action)=["']([^"']+)["']/g)].map((match) => match[1])
}

function extractMetaContent(html, propertyOrName) {
  const escaped = propertyOrName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `<meta\\s+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']+)["']`,
    'i'
  )
  return pattern.exec(html)?.[1] ?? ''
}

function extractCanonical(html) {
  return /<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i.exec(html)?.[1] ?? ''
}

function assertNoStaleHost(relativeFile, value) {
  if (value.includes(staleCustomHost)) {
    failures.push(`${relativeFile} contains stale custom-domain reference ${staleCustomHost}`)
  }
}

function assertHtmlFile(file) {
  const html = readFileSync(file, 'utf8')
  const relativeFile = `out/${relativeOut(file)}`
  const route = routeForHtml(file)

  assertNoStaleHost(relativeFile, html)

  if (route) {
    const expectedCanonical = absoluteUrl(route)
    const canonical = extractCanonical(html)
    if (canonical !== expectedCanonical) {
      failures.push(
        `${relativeFile} canonical mismatch: expected ${expectedCanonical}, found ${
          canonical || '(missing)'
        }`
      )
    }

    const ogUrl = extractMetaContent(html, 'og:url')
    if (ogUrl && ogUrl !== expectedCanonical) {
      failures.push(
        `${relativeFile} og:url mismatch: expected ${expectedCanonical}, found ${ogUrl}`
      )
    }
  }

  for (const value of extractAttributeValues(html)) {
    if (isIgnorableReference(value) || /^https?:\/\//.test(value)) {
      assertOutReferenceExists(relativeFile, value)
      continue
    }

    if (!value.startsWith('/')) continue

    if (BASE_PATH) {
      const isProjectScoped = value === BASE_PATH || value.startsWith(`${BASE_PATH}/`)
      if (!isProjectScoped) {
        failures.push(`${relativeFile} contains root-scoped asset or route reference: ${value}`)
        continue
      }
    } else if (value === '/polaris-docs' || value.startsWith('/polaris-docs/')) {
      failures.push(`${relativeFile} contains stale project-page path reference: ${value}`)
      continue
    }

    assertOutReferenceExists(relativeFile, value)
  }
}

function assertGeneratedTextArtifact(relativePath, text) {
  assertNoStaleHost(`out/${relativePath}`, text)
  if (BASE_PATH === '' && text.includes('/polaris-docs/')) {
    failures.push(`out/${relativePath} contains stale project-page path references`)
  }
}

function assertSitemap(sitemap) {
  const sitemapLocations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])

  if (!sitemapLocations.length) {
    failures.push('out/sitemap.xml has no <loc> entries')
  }

  for (const loc of sitemapLocations) {
    if (!loc.startsWith(SITE_BASE_URL)) {
      failures.push(`out/sitemap.xml location does not match SITE_URL/BASE_PATH: ${loc}`)
    }
    if (BASE_PATH && !new URL(loc).pathname.startsWith(BASE_PATH)) {
      failures.push(`out/sitemap.xml location is missing BASE_PATH=${BASE_PATH}: ${loc}`)
    }
    assertOutReferenceExists('out/sitemap.xml', loc)
  }
}

function assertRobots(robots) {
  const expectedSitemap = `Sitemap: ${absoluteUrl('/sitemap.xml')}`
  if (!robots.includes(expectedSitemap)) {
    failures.push(`out/robots.txt does not include ${expectedSitemap}`)
  }
}

function assertLlms(relativePath, text) {
  const urls = [...text.matchAll(/https?:\/\/[^\s)\]]+/g)].map((match) => match[0])

  if (!urls.length) failures.push(`out/${relativePath} contains no URLs`)

  for (const url of urls) {
    const parsed = new URL(url)
    if (parsed.host !== expectedHost) continue
    if (!url.startsWith(SITE_BASE_URL)) {
      failures.push(`out/${relativePath} URL does not match SITE_URL/BASE_PATH: ${url}`)
      continue
    }
    assertOutReferenceExists(`out/${relativePath}`, url)
  }
}

function assertLlmsIndex(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    failures.push(`out/llms-index.json is invalid JSON: ${error.message}`)
    return
  }

  if (parsed.site !== absoluteUrl('/')) {
    failures.push(
      `out/llms-index.json site mismatch: expected ${absoluteUrl('/')}, found ${parsed.site}`
    )
  }

  if (!Array.isArray(parsed.pages) || parsed.pages.length === 0) {
    failures.push('out/llms-index.json has no pages')
    return
  }

  for (const page of parsed.pages) {
    if (typeof page.url !== 'string' || !page.url.startsWith(SITE_BASE_URL)) {
      failures.push(`out/llms-index.json page URL does not match SITE_URL/BASE_PATH: ${page.url}`)
      continue
    }
    assertOutReferenceExists('out/llms-index.json', page.url)
  }
}

function assertLlmsSections() {
  const sectionDir = path.join(outDir, 'llms-sections')
  if (!existsSync(sectionDir)) {
    failures.push('out/llms-sections is missing')
    return
  }

  const files = walk(sectionDir).filter((file) => file.endsWith('.txt'))
  if (!files.length) {
    failures.push('out/llms-sections contains no section text files')
    return
  }

  for (const file of files) {
    const relativePath = relativeOut(file)
    const text = readFileSync(file, 'utf8')
    assertGeneratedTextArtifact(relativePath, text)
    assertLlms(relativePath, text)
  }
}

function assertCnameMode() {
  const cnamePath = path.join(outDir, 'CNAME')
  if (BASE_PATH && existsSync(cnamePath)) {
    failures.push('out/CNAME exists, but project-page mode must not publish a custom domain')
    return
  }

  if (!BASE_PATH && existsSync(cnamePath)) {
    const cname = readFileSync(cnamePath, 'utf8').trim()
    if (cname !== expectedHost) {
      failures.push(`out/CNAME host mismatch: expected ${expectedHost}, found ${cname}`)
    }
  }
}

if (!existsSync(outDir)) {
  console.error('out/ is missing; run npm run build first')
  process.exit(1)
}

const htmlFiles = walk(outDir).filter((file) => file.endsWith('.html'))
if (!htmlFiles.length) failures.push('out/ contains no HTML files')

for (const file of htmlFiles) assertHtmlFile(file)

const sitemap = readOut('sitemap.xml')
const robots = readOut('robots.txt')
const llms = readOut('llms.txt')
const llmsFull = readOut('llms-full.txt')
const llmsIndex = readOut('llms-index.json')

assertGeneratedTextArtifact('sitemap.xml', sitemap)
assertGeneratedTextArtifact('robots.txt', robots)
assertGeneratedTextArtifact('llms.txt', llms)
assertGeneratedTextArtifact('llms-full.txt', llmsFull)
assertGeneratedTextArtifact('llms-index.json', llmsIndex)
assertSitemap(sitemap)
assertRobots(robots)
assertLlms('llms.txt', llms)
assertLlms('llms-full.txt', llmsFull)
assertLlmsIndex(llmsIndex)
assertLlmsSections()
assertCnameMode()

for (const requiredAsset of [
  '_pagefind/pagefind.js',
  'favicon.svg',
  'og-image.png',
  'emblem.svg'
]) {
  if (!existsSync(path.join(outDir, requiredAsset))) {
    failures.push(`out/${requiredAsset} is missing`)
  }
}

const faqHtml = readOut('resources/faq.html')
if (faqHtml && !faqHtml.includes('"@type":"FAQPage"')) {
  failures.push('out/resources/faq.html is missing FAQPage structured data')
}

if (failures.length) {
  console.error('Export artifact smoke check failed:\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  `Export artifact smoke check passed (${htmlFiles.length} HTML files, base path ${
    BASE_PATH || '/'
  }).`
)
