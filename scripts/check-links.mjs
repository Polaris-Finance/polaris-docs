import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { BASE_PATH, SITE_URL } from '../app/site-config.mjs'

const root = process.cwd()
const checkExternal =
  process.argv.includes('--external') || process.env.CHECK_EXTERNAL_LINKS === '1'
const sourceRoots = ['content', 'app', 'components', 'README.md'].map((entry) =>
  path.join(root, entry)
)
const publicDir = path.join(root, 'public')
const contentDir = path.join(root, 'content')

const sourceFiles = []
const mdxFiles = []

function walk(target, cb) {
  const stat = statSync(target)
  if (stat.isDirectory()) {
    for (const entry of readdirSync(target)) {
      if (entry === 'node_modules' || entry === '.next' || entry === 'out') continue
      walk(path.join(target, entry), cb)
    }
    return
  }
  cb(target)
}

for (const target of sourceRoots) {
  walk(target, (file) => {
    if (/\.(mdx|md|jsx?|mjs)$/.test(file)) sourceFiles.push(file)
  })
}

for (const generatedFile of ['llms.txt', 'llms-full.txt', 'llms-index.json']) {
  const file = path.join(publicDir, generatedFile)
  if (existsSync(file)) sourceFiles.push(file)
}

const sectionLlmsDir = path.join(publicDir, 'llms-sections')
if (existsSync(sectionLlmsDir)) {
  walk(sectionLlmsDir, (file) => {
    if (file.endsWith('.txt')) sourceFiles.push(file)
  })
}

walk(contentDir, (file) => {
  if (file.endsWith('.mdx')) mdxFiles.push(file)
})

const routes = new Map()
const anchorsByRoute = new Map()

function routeForMdx(file) {
  const rel = path.relative(contentDir, file).replace(/\\/g, '/')
  const withoutExt = rel.replace(/\.mdx$/, '')
  if (withoutExt === 'index') return '/'
  if (withoutExt.endsWith('/index')) return `/${withoutExt.slice(0, -'/index'.length)}`
  return `/${withoutExt}`
}

function slugify(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

for (const file of mdxFiles) {
  const route = routeForMdx(file)
  routes.set(route, file)
  const anchors = new Set()
  const text = readFileSync(file, 'utf8')
  for (const line of text.split('\n')) {
    const match = /^(#{1,6})\s+(.+)$/.exec(line)
    if (match) anchors.add(slugify(match[2]))
  }
  anchorsByRoute.set(route, anchors)
}

const markdownOrHtmlLinkPattern =
  /!?\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)|\b(?:href|src)=["']([^"']+)["']/g
const jsxPropLinkPattern = /\b(?:url|image|appUrl|appHref|ctaUrl|ctaHref)=["']([^"']+)["']/g
const rawUrlPattern = /\bhttps?:\/\/[^\s"'<>),\]]+/g
const links = []

function pushLink(file, href, seen) {
  const normalized = href.replace(/[.;]+$/, '')
  if (
    !normalized ||
    normalized.startsWith('{') ||
    normalized.startsWith('mailto:') ||
    normalized.startsWith('tel:') ||
    seen.has(normalized)
  ) {
    return
  }

  seen.add(normalized)
  links.push({ file, href: normalized })
}

for (const file of sourceFiles) {
  const text = readFileSync(file, 'utf8')
  const seen = new Set()
  let match
  while ((match = markdownOrHtmlLinkPattern.exec(text))) {
    pushLink(file, match[1] || match[2], seen)
  }
  while ((match = jsxPropLinkPattern.exec(text))) {
    pushLink(file, match[1], seen)
  }
  if (file.startsWith(publicDir)) {
    while ((match = rawUrlPattern.exec(text))) {
      pushLink(file, match[0], seen)
    }
  }
}

const failures = []
const externalLinks = new Map()

function splitHash(href) {
  const index = href.indexOf('#')
  if (index === -1) return [href, '']
  return [href.slice(0, index), decodeURIComponent(href.slice(index + 1))]
}

function splitSearchAndHash(href) {
  const [withoutHash, hash] = splitHash(href)
  const queryIndex = withoutHash.indexOf('?')
  if (queryIndex === -1) return [withoutHash, hash]
  return [withoutHash.slice(0, queryIndex), hash]
}

function normalizeRoute(route) {
  if (!route || route === '/') return '/'
  return route.replace(/\/$/, '')
}

function stripBasePath(targetPath) {
  if (!BASE_PATH) return targetPath
  if (targetPath === BASE_PATH) return '/'
  if (targetPath.startsWith(`${BASE_PATH}/`)) return targetPath.slice(BASE_PATH.length) || '/'
  return targetPath
}

function localHrefForOwnAbsolute(href) {
  try {
    const url = new URL(href)
    const site = new URL(SITE_URL)
    if (url.origin !== site.origin) return null
    return `${stripBasePath(url.pathname)}${url.search}${url.hash}`
  } catch {
    return null
  }
}

const assetMimeExpectations = new Map([
  ['.css', ['text/css']],
  ['.ico', ['image/x-icon', 'image/vnd.microsoft.icon']],
  ['.js', ['application/javascript', 'text/javascript']],
  ['.json', ['application/json']],
  ['.png', ['image/png']],
  ['.svg', ['image/svg+xml']],
  ['.txt', ['text/plain']],
  ['.xml', ['application/xml', 'text/xml']]
])

function extensionForUrl(href) {
  try {
    const url = /^https?:\/\//.test(href) ? new URL(href) : null
    return path.extname(url ? url.pathname : splitSearchAndHash(href)[0]).toLowerCase()
  } catch {
    return path.extname(splitSearchAndHash(href)[0]).toLowerCase()
  }
}

function expectedMimeTypes(href) {
  return assetMimeExpectations.get(extensionForUrl(href)) ?? null
}

function hasAssetExtension(href) {
  return expectedMimeTypes(href) !== null
}

function shouldHaveTrailingSlash(href) {
  if (!/^https?:\/\//.test(href)) return false

  try {
    const url = new URL(href)
    return (
      url.origin === 'https://polarisfinance.io' &&
      (url.pathname === '/blog' || url.pathname.startsWith('/blog/')) &&
      !url.pathname.endsWith('/') &&
      !hasAssetExtension(href)
    )
  } catch {
    return false
  }
}

function contentTypeMatches(contentType, expected) {
  if (!contentType) return false
  const normalized = contentType.split(';')[0].trim().toLowerCase()
  return expected.includes(normalized)
}

function validateLocalAssetMime(assetPath, href, file) {
  const expected = expectedMimeTypes(href)
  if (!expected) return

  const rel = path.relative(root, file)
  const buffer = readFileSync(assetPath)
  const text = buffer.toString('utf8', 0, Math.min(buffer.length, 300)).trimStart()
  const ext = extensionForUrl(href)
  let valid = true

  if (ext === '.png') {
    valid = buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  } else if (ext === '.svg') {
    valid = /^<\?xml\b/i.test(text) || /^<svg\b/i.test(text)
  } else if (ext === '.ico') {
    valid =
      buffer.length >= 4 &&
      buffer[0] === 0x00 &&
      buffer[1] === 0x00 &&
      buffer[2] === 0x01 &&
      buffer[3] === 0x00
  } else if (ext === '.json') {
    try {
      JSON.parse(buffer.toString('utf8'))
    } catch {
      valid = false
    }
  } else if (ext === '.xml') {
    valid = /^<\?xml\b/i.test(text)
  } else if (ext === '.txt' || ext === '.css' || ext === '.js') {
    valid = !buffer.includes(0x00)
  }

  if (!valid) {
    failures.push(`${rel}: public asset ${href} does not match expected MIME ${expected.join('/')}`)
  }
}

function checkAnchor(route, hash, file, href) {
  if (!hash) return
  const anchors = anchorsByRoute.get(route)
  if (!anchors || !anchors.has(hash)) {
    failures.push(`${path.relative(root, file)}: broken anchor ${href}`)
  }
}

for (const { file, href: originalHref } of links) {
  if (shouldHaveTrailingSlash(originalHref)) {
    failures.push(
      `${path.relative(root, file)}: Polaris blog URL should include a trailing slash ${originalHref}`
    )
  }

  const ownHref = /^https?:\/\//.test(originalHref) ? localHrefForOwnAbsolute(originalHref) : null
  const href = ownHref ?? originalHref

  if (/^https?:\/\//.test(href)) {
    externalLinks.set(href, file)
    continue
  }

  if (href.startsWith('#')) {
    const route = routeForMdx(file.endsWith('.mdx') ? file : path.join(contentDir, 'index.mdx'))
    checkAnchor(route, decodeURIComponent(href.slice(1)), file, href)
    continue
  }

  if (href.startsWith('/')) {
    const [rawTargetPath, hash] = splitSearchAndHash(href)
    const targetPath = stripBasePath(rawTargetPath)
    const normalized = normalizeRoute(targetPath)
    if (/\.[a-z0-9]+$/i.test(targetPath)) {
      const assetPath = path.join(publicDir, targetPath)
      if (!existsSync(assetPath)) {
        failures.push(`${path.relative(root, file)}: missing public asset ${href}`)
      } else {
        validateLocalAssetMime(assetPath, href, file)
      }
      continue
    }
    if (!routes.has(normalized)) {
      failures.push(`${path.relative(root, file)}: broken internal route ${href}`)
      continue
    }
    checkAnchor(normalized, hash, file, href)
    continue
  }

  if (href.startsWith('.')) {
    const resolved = path.resolve(path.dirname(file), href)
    if (!existsSync(resolved)) {
      failures.push(`${path.relative(root, file)}: missing relative target ${href}`)
    }
  }
}

async function checkExternalLink(url, file) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'polaris-docs-link-check/1.0' }
    })
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': 'polaris-docs-link-check/1.0' }
      })
    }
    if (response.status >= 400) {
      failures.push(
        `${path.relative(root, file)}: external link returned ${response.status} ${url}`
      )
    } else if (hasAssetExtension(url)) {
      const expected = expectedMimeTypes(url)
      const contentType = response.headers.get('content-type')
      if (!contentTypeMatches(contentType, expected)) {
        failures.push(
          `${path.relative(root, file)}: external asset MIME mismatch ${url} (got ${contentType ?? 'none'}, expected ${expected.join(' or ')})`
        )
      }
    }
  } catch (error) {
    failures.push(`${path.relative(root, file)}: external link failed ${url} (${error.message})`)
  } finally {
    clearTimeout(timeout)
  }
}

if (checkExternal) {
  await Promise.all([...externalLinks.entries()].map(([url, file]) => checkExternalLink(url, file)))
}

if (failures.length) {
  console.error('Link check failed:\n')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

const externalNote = checkExternal ? ` and ${externalLinks.size} external links` : ''
console.log(`Link check passed (${links.length} links${externalNote}).`)
