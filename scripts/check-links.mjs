import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const checkExternal = process.argv.includes('--external') || process.env.CHECK_EXTERNAL_LINKS === '1'
const sourceRoots = ['content', 'app', 'README.md'].map((entry) => path.join(root, entry))
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

const linkPattern = /!?\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)|(?:href|src)=["']([^"']+)["']/g
const links = []

for (const file of sourceFiles) {
  const text = readFileSync(file, 'utf8')
  let match
  while ((match = linkPattern.exec(text))) {
    const href = match[1] || match[2]
    if (!href || href.startsWith('{') || href.startsWith('mailto:') || href.startsWith('tel:')) continue
    links.push({ file, href })
  }
}

const failures = []
const externalLinks = new Map()

function splitHash(href) {
  const index = href.indexOf('#')
  if (index === -1) return [href, '']
  return [href.slice(0, index), decodeURIComponent(href.slice(index + 1))]
}

function normalizeRoute(route) {
  if (!route || route === '/') return '/'
  return route.replace(/\/$/, '')
}

function checkAnchor(route, hash, file, href) {
  if (!hash) return
  const anchors = anchorsByRoute.get(route)
  if (!anchors || !anchors.has(hash)) {
    failures.push(`${path.relative(root, file)}: broken anchor ${href}`)
  }
}

for (const { file, href } of links) {
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
    const [targetPath, hash] = splitHash(href)
    const normalized = normalizeRoute(targetPath)
    if (/\.[a-z0-9]+$/i.test(targetPath)) {
      if (!existsSync(path.join(publicDir, targetPath))) {
        failures.push(`${path.relative(root, file)}: missing public asset ${href}`)
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
      failures.push(`${path.relative(root, file)}: external link returned ${response.status} ${url}`)
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
