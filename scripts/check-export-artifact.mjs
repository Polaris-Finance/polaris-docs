import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { LEGACY_REDIRECTS } from '../app/legacy-redirects.mjs'
import {
  absoluteUrl,
  BASE_PATH,
  OG_IMAGE_PATH,
  ORGANIZATION_URL,
  markdownPathForRoute,
  SITE_BASE_URL,
  SITE_URL
} from '../app/site-config.mjs'
import { lastModifiedForFile, routeForFile, walkMdx } from './lib/content.mjs'

const root = process.cwd()
const outDir = path.join(root, 'out')
const contentDir = path.join(root, 'content')
const failures = []
const staleHosts = ['docs.polarisfinance.io', 'tokenbrice.github.io', 'polaris-finance.github.io']
const expectedHost = new URL(SITE_URL).host
const expectedPages = new Map(
  walkMdx(contentDir).map((fullPath) => {
    const route = routeForFile(contentDir, fullPath)
    return [route, { modified: lastModifiedForFile(fullPath) }]
  })
)

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

function tagAttribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}=["']([^"']*)["']`, 'i').exec(tag)?.[1] ?? ''
}

function alternateLinks(html) {
  return [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => tagAttribute(tag, 'rel').toLowerCase() === 'alternate')
    .map((tag) => ({ href: tagAttribute(tag, 'href'), type: tagAttribute(tag, 'type') }))
}

function assertPageAlternate(relativeFile, html, route) {
  const alternates = alternateLinks(html)
  const expected = absoluteUrl(markdownPathForRoute(route))

  if (alternates.length !== 1) {
    failures.push(
      `${relativeFile} has ${alternates.length} alternates; expected one Markdown mirror`
    )
    return
  }

  const alternate = alternates[0]
  if (alternate.type !== 'text/markdown' || !urlsMatch(alternate.href, expected)) {
    failures.push(
      `${relativeFile} alternate mismatch: expected text/markdown ${expected}, found ${
        alternate.type || '(missing type)'
      } ${alternate.href || '(missing href)'}`
    )
  }
}

function extractJsonLd(relativeFile, html) {
  const items = []
  const scripts = html.matchAll(
    /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )

  for (const script of scripts) {
    try {
      items.push(JSON.parse(script[1]))
    } catch (error) {
      failures.push(`${relativeFile} has invalid JSON-LD: ${error.message}`)
    }
  }

  return items.flatMap((item) => (Array.isArray(item) ? item : [item]))
}

function assertStructuredData(relativeFile, html, route) {
  const items = extractJsonLd(relativeFile, html)
  const organization = items.find((item) => item?.['@type'] === 'Organization')
  const breadcrumbs = items.filter((item) => item?.['@type'] === 'BreadcrumbList')
  const pageItems = items.filter((item) =>
    ['CollectionPage', 'TechArticle'].includes(item?.['@type'])
  )
  const expectedType = route === '/' ? 'CollectionPage' : 'TechArticle'
  const pageItem = pageItems.find((item) => item['@type'] === expectedType)
  const expectedModified = expectedPages.get(route)?.modified

  if (!organization) {
    failures.push(`${relativeFile} is missing Organization JSON-LD`)
  } else if (organization.url !== ORGANIZATION_URL) {
    failures.push(
      `${relativeFile} Organization URL mismatch: expected ${ORGANIZATION_URL}, found ${
        organization.url ?? '(missing)'
      }`
    )
  }

  if (pageItems.length !== 1 || !pageItem) {
    failures.push(`${relativeFile} must contain exactly one ${expectedType} page entity`)
  } else {
    if (pageItem.dateModified !== expectedModified) {
      failures.push(
        `${relativeFile} dateModified mismatch: expected ${expectedModified}, found ${
          pageItem.dateModified ?? '(missing)'
        }`
      )
    }
    if ('datePublished' in pageItem) {
      failures.push(`${relativeFile} must not infer datePublished from repository history`)
    }
  }

  if (route === '/') {
    if (breadcrumbs.length) failures.push(`${relativeFile} should not advertise root breadcrumbs`)
    return
  }

  if (breadcrumbs.length !== 1) {
    failures.push(`${relativeFile} should contain exactly one BreadcrumbList`)
    return
  }

  const elements = breadcrumbs[0].itemListElement
  if (!Array.isArray(elements) || elements.length < 2) {
    failures.push(`${relativeFile} BreadcrumbList must contain at least two ListItems`)
    return
  }

  elements.forEach((element, index) => {
    if (element.position !== index + 1) {
      failures.push(
        `${relativeFile} breadcrumb position ${element.position} is not sequential at item ${
          index + 1
        }`
      )
    }

    if (index < elements.length - 1 && !element.item) {
      failures.push(`${relativeFile} breadcrumb item ${index + 1} is missing its required URL`)
    }

    if (element.item) assertOutReferenceExists(relativeFile, element.item)
  })
}

function assertNavigationAssets(relativeFile, html) {
  if (/<link[^>]+rel=["']preload["'][^>]+\/asset-icons\//i.test(html)) {
    failures.push(`${relativeFile} eagerly preloads navigation asset icons`)
  }

  for (const [tag] of html.matchAll(/<img\b[^>]*\bpl-nav-icon-asset\b[^>]*>/gi)) {
    if (!/\bloading=["']lazy["']/i.test(tag)) {
      failures.push(`${relativeFile} contains a navigation asset icon without lazy loading`)
    }
  }
}

function assertNoStaleHost(relativeFile, value) {
  for (const staleHost of staleHosts) {
    if (value.includes(staleHost)) {
      failures.push(`${relativeFile} contains stale host reference ${staleHost}`)
    }
  }
}

function urlsMatch(actual, expected) {
  if (!actual) return false
  try {
    return new URL(actual).href === new URL(expected).href
  } catch {
    return false
  }
}

function assertHtmlFile(file) {
  const html = readFileSync(file, 'utf8')
  const relativeFile = `out/${relativeOut(file)}`
  const route = routeForHtml(file)

  assertNoStaleHost(relativeFile, html)

  if (route && Object.hasOwn(LEGACY_REDIRECTS, route)) {
    const target = LEGACY_REDIRECTS[route]
    const expectedCanonical = absoluteUrl(target)
    const canonical = extractCanonical(html)
    const refresh = /<meta\s+http-equiv=["']refresh["'][^>]*content=["']([^"']+)["']/i.exec(
      html
    )?.[1]

    if (!urlsMatch(canonical, expectedCanonical)) {
      failures.push(
        `${relativeFile} redirect canonical mismatch: expected ${expectedCanonical}, found ${
          canonical || '(missing)'
        }`
      )
    }
    if (refresh !== `0;url=${expectedCanonical}`) {
      failures.push(
        `${relativeFile} refresh mismatch: expected 0;url=${expectedCanonical}, found ${
          refresh || '(missing)'
        }`
      )
    }
    if (Object.hasOwn(LEGACY_REDIRECTS, target)) {
      failures.push(`${relativeFile} redirects through another legacy route: ${target}`)
    }
    assertOutReferenceExists(relativeFile, expectedCanonical)
    return
  }

  if (route) {
    if (!expectedPages.has(route)) {
      failures.push(`${relativeFile} is neither a canonical content route nor a legacy redirect`)
      return
    }

    const expectedCanonical = absoluteUrl(route)
    const canonical = extractCanonical(html)
    if (!urlsMatch(canonical, expectedCanonical)) {
      failures.push(
        `${relativeFile} canonical mismatch: expected ${expectedCanonical}, found ${
          canonical || '(missing)'
        }`
      )
    }

    const ogUrl = extractMetaContent(html, 'og:url')
    if (ogUrl && !urlsMatch(ogUrl, expectedCanonical)) {
      failures.push(
        `${relativeFile} og:url mismatch: expected ${expectedCanonical}, found ${ogUrl}`
      )
    }

    const ogTitle = extractMetaContent(html, 'og:title')
    if (!ogTitle) {
      failures.push(`${relativeFile} is missing a non-empty og:title`)
    }

    const ogDescription = extractMetaContent(html, 'og:description')
    if (!ogDescription) {
      failures.push(`${relativeFile} is missing a non-empty og:description`)
    }

    const ogImage = extractMetaContent(html, 'og:image')
    const expectedOgImage = absoluteUrl(OG_IMAGE_PATH)
    if (ogImage && ogImage !== expectedOgImage) {
      failures.push(
        `${relativeFile} og:image mismatch: expected ${expectedOgImage}, found ${ogImage}`
      )
    }

    assertStructuredData(relativeFile, html, route)
    assertPageAlternate(relativeFile, html, route)
    assertNavigationAssets(relativeFile, html)
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
  if (text.includes('Relevant app/search vocabulary:')) {
    failures.push(`out/${relativePath} contains generated search vocabulary prose`)
  }
}

function assertSitemap(sitemap) {
  const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => ({
    loc: /<loc>(.*?)<\/loc>/.exec(match[1])?.[1] ?? '',
    lastmod: /<lastmod>(.*?)<\/lastmod>/.exec(match[1])?.[1] ?? ''
  }))
  const sitemapPages = new Map(entries.map((entry) => [entry.loc, entry.lastmod]))
  const sitemapLocations = entries.map((entry) => entry.loc)

  if (entries.length !== expectedPages.size) {
    failures.push(`out/sitemap.xml has ${entries.length} URLs; expected ${expectedPages.size}`)
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

  for (const [route, { modified }] of expectedPages) {
    const url = absoluteUrl(route)
    if (!sitemapPages.has(url)) {
      failures.push(`out/sitemap.xml is missing canonical route ${route}`)
    } else if (sitemapPages.get(url) !== modified) {
      failures.push(
        `out/sitemap.xml lastmod mismatch for ${route}: expected ${modified}, found ${
          sitemapPages.get(url) || '(missing)'
        }`
      )
    }
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

  if (parsed.pages.length !== expectedPages.size) {
    failures.push(
      `out/llms-index.json has ${parsed.pages.length} pages; expected ${expectedPages.size}`
    )
  }

  for (const page of parsed.pages) {
    const expected = expectedPages.get(page.route)
    if (!expected) {
      failures.push(`out/llms-index.json contains unexpected route ${page.route}`)
      continue
    }

    if (typeof page.url !== 'string' || !page.url.startsWith(SITE_BASE_URL)) {
      failures.push(`out/llms-index.json page URL does not match SITE_URL/BASE_PATH: ${page.url}`)
      continue
    }
    assertOutReferenceExists('out/llms-index.json', page.url)

    if (typeof page.markdownUrl !== 'string' || !page.markdownUrl.startsWith(SITE_BASE_URL)) {
      failures.push(
        `out/llms-index.json markdown URL does not match SITE_URL/BASE_PATH: ${page.markdownUrl}`
      )
      continue
    }
    assertOutReferenceExists('out/llms-index.json', page.markdownUrl)

    const expectedMarkdownUrl = absoluteUrl(markdownPathForRoute(page.route))
    if (!urlsMatch(page.markdownUrl, expectedMarkdownUrl)) {
      failures.push(
        `out/llms-index.json Markdown URL mismatch for ${page.route}: expected ${expectedMarkdownUrl}, found ${page.markdownUrl}`
      )
    }
    if (page.updated !== expected.modified) {
      failures.push(
        `out/llms-index.json updated mismatch for ${page.route}: expected ${expected.modified}, found ${page.updated ?? '(missing)'}`
      )
    }

    const markdownPath = markdownPathForRoute(page.route).replace(/^\//, '')
    const markdown = readOut(markdownPath)
    const markdownUpdated = /^Updated:\s*(\d{4}-\d{2}-\d{2})\s*$/m.exec(markdown)?.[1]
    if (markdownUpdated !== expected.modified) {
      failures.push(
        `out/${markdownPath} Updated mismatch: expected ${expected.modified}, found ${
          markdownUpdated ?? '(missing)'
        }`
      )
    }
  }

  const sections = parsed.artifacts?.sections ?? []
  if (!Array.isArray(sections) || !sections.length) {
    failures.push('out/llms-index.json has no section artifact entries')
  }

  for (const section of sections) {
    if (typeof section.url !== 'string' || !section.url.startsWith(SITE_BASE_URL)) {
      failures.push(
        `out/llms-index.json section URL does not match SITE_URL/BASE_PATH: ${section.url}`
      )
      continue
    }
    assertOutReferenceExists('out/llms-index.json', section.url)
  }

  for (const [key, value] of Object.entries(parsed.artifacts ?? {})) {
    if (key === 'sections') continue
    if (typeof value !== 'string') continue
    if (!value.startsWith(SITE_BASE_URL)) {
      failures.push(`out/llms-index.json artifact URL does not match SITE_URL/BASE_PATH: ${value}`)
      continue
    }
    assertOutReferenceExists('out/llms-index.json', value)
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

for (const source of Object.keys(LEGACY_REDIRECTS)) {
  const relativePath = `${source.slice(1)}.html`
  if (!existsSync(path.join(outDir, relativePath))) {
    failures.push(`out/${relativePath} legacy redirect is missing`)
  }
}

const sitemap = readOut('sitemap.xml')
const robots = readOut('robots.txt')
const llms = readOut('llms.txt')
const wellKnownLlms = readOut('.well-known/llms.txt')
const llmsFull = readOut('llms-full.txt')
const wellKnownLlmsFull = readOut('.well-known/llms-full.txt')
const llmsIndex = readOut('llms-index.json')

assertGeneratedTextArtifact('sitemap.xml', sitemap)
assertGeneratedTextArtifact('robots.txt', robots)
assertGeneratedTextArtifact('llms.txt', llms)
assertGeneratedTextArtifact('.well-known/llms.txt', wellKnownLlms)
assertGeneratedTextArtifact('llms-full.txt', llmsFull)
assertGeneratedTextArtifact('.well-known/llms-full.txt', wellKnownLlmsFull)
assertGeneratedTextArtifact('llms-index.json', llmsIndex)
assertSitemap(sitemap)
assertRobots(robots)
assertLlms('llms.txt', llms)
assertLlms('.well-known/llms.txt', wellKnownLlms)
assertLlms('llms-full.txt', llmsFull)
assertLlms('.well-known/llms-full.txt', wellKnownLlmsFull)
assertLlmsIndex(llmsIndex)
assertLlmsSections()
assertCnameMode()

for (const requiredAsset of [
  '_pagefind/pagefind.js',
  '404.html',
  'favicon.svg',
  'og-image.png',
  'emblem.svg'
]) {
  if (!existsSync(path.join(outDir, requiredAsset))) {
    failures.push(`out/${requiredAsset} is missing`)
  }
}

// Image weight budget: an unoptimized 432 KB screenshot once shipped twice;
// keep raster assets lean (re-export as JPEG/WebP like the other screenshots).
const imageBudgetBytes = 150 * 1024
for (const file of walk(outDir)) {
  if (!/\.(png|jpe?g|gif|webp|avif)$/i.test(file)) continue
  const size = statSync(file).size
  if (size > imageBudgetBytes) {
    failures.push(
      `out/${relativeOut(file)} is ${Math.round(size / 1024)} KB; image budget is ${imageBudgetBytes / 1024} KB`
    )
  }
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
