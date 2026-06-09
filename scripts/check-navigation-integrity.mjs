import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { absoluteUrl } from '../app/site-config.mjs'

const root = process.cwd()
const contentDir = path.join(root, 'content')
const publicDir = path.join(root, 'public')
const outDir = path.join(root, 'out')
const failures = []

function walk(dir) {
  const entries = []
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) entries.push(...walk(fullPath))
    else if (entry.endsWith('.mdx')) entries.push(fullPath)
  }
  return entries
}

function routeForFile(fullPath) {
  const rel = path.relative(contentDir, fullPath).replace(/\\/g, '/')
  const route = rel.replace(/\.mdx$/, '')
  if (route === 'index') return '/'
  if (route.endsWith('/index')) return `/${route.slice(0, -'/index'.length)}`
  return `/${route}`
}

function markdownPathForRoute(route) {
  if (route === '/') return 'index.md'
  return `${route.replace(/^\//, '').replace(/\/$/, '')}.md`
}

function metaPathForFile(fullPath) {
  return path.join(path.dirname(fullPath), '_meta.js')
}

function metaKeyForFile(fullPath) {
  const basename = path.basename(fullPath, '.mdx')
  return basename === 'index' ? 'index' : basename
}

async function loadMeta(metaPath) {
  if (!existsSync(metaPath)) return null
  const module = await import(`${pathToFileURL(metaPath).href}?mtime=${statSync(metaPath).mtimeMs}`)
  return module.default ?? null
}

function routeToOutHtml(route) {
  if (route === '/') return 'index.html'
  const normalized = route.replace(/^\/+/, '')
  if (existsSync(path.join(outDir, `${normalized}.html`))) return `${normalized}.html`
  return `${normalized}/index.html`
}

function readJson(relativePath) {
  const fullPath = path.join(publicDir, relativePath)
  if (!existsSync(fullPath)) {
    failures.push(`public/${relativePath} is missing`)
    return null
  }

  try {
    return JSON.parse(readFileSync(fullPath, 'utf8'))
  } catch (error) {
    failures.push(`public/${relativePath} is invalid JSON: ${error.message}`)
    return null
  }
}

const files = walk(contentDir).sort()
const routes = new Set(files.map(routeForFile))

for (const file of files) {
  const rel = path.relative(root, file)
  const metaPath = metaPathForFile(file)
  const meta = await loadMeta(metaPath)
  if (!meta) {
    failures.push(`${rel}: missing sibling _meta.js`)
    continue
  }

  const key = metaKeyForFile(file)
  if (!Object.hasOwn(meta, key)) {
    failures.push(`${rel}: sibling _meta.js is missing key "${key}"`)
  }
}

const sitemapPath = path.join(publicDir, 'sitemap.xml')
if (!existsSync(sitemapPath)) {
  failures.push('public/sitemap.xml is missing')
} else {
  const sitemap = readFileSync(sitemapPath, 'utf8')
  const sitemapRoutes = new Set(
    [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => new URL(match[1]).pathname)
  )

  for (const route of routes) {
    const expectedPath = new URL(absoluteUrl(route)).pathname
    if (!sitemapRoutes.has(expectedPath)) {
      failures.push(`public/sitemap.xml is missing route ${route}`)
    }
  }
}

const llmsIndex = readJson('llms-index.json')
if (llmsIndex) {
  const indexedRoutes = new Set((llmsIndex.pages ?? []).map((page) => page.route))
  for (const route of routes) {
    if (!indexedRoutes.has(route)) failures.push(`public/llms-index.json is missing route ${route}`)
  }

  for (const page of llmsIndex.pages ?? []) {
    const markdownUrl = page.markdownUrl
    if (typeof markdownUrl !== 'string') {
      failures.push(`public/llms-index.json route ${page.route} is missing markdownUrl`)
      continue
    }

    const expectedPath = new URL(absoluteUrl(`/${markdownPathForRoute(page.route)}`)).pathname
    if (new URL(markdownUrl).pathname !== expectedPath) {
      failures.push(`public/llms-index.json markdownUrl mismatch for ${page.route}`)
    }

    const markdownFile = path.join(publicDir, markdownPathForRoute(page.route))
    if (!existsSync(markdownFile)) {
      failures.push(`public/${markdownPathForRoute(page.route)} is missing`)
    }
  }
}

const llmsPath = path.join(publicDir, 'llms.txt')
if (!existsSync(llmsPath)) {
  failures.push('public/llms.txt is missing')
} else {
  const llms = readFileSync(llmsPath, 'utf8')
  for (const route of routes) {
    const expectedUrl = absoluteUrl(route)
    if (!llms.includes(expectedUrl)) failures.push(`public/llms.txt is missing route ${route}`)
  }
}

const pagefindEntry = path.join(outDir, '_pagefind', 'pagefind-entry.json')
if (existsSync(pagefindEntry)) {
  const entry = JSON.parse(readFileSync(pagefindEntry, 'utf8'))
  const pageCount = entry.languages?.en?.page_count ?? 0
  if (pageCount < routes.size) {
    failures.push(`out/_pagefind indexed ${pageCount} pages; expected at least ${routes.size}`)
  }
}

if (existsSync(outDir)) {
  for (const route of routes) {
    const htmlPath = routeToOutHtml(route)
    if (!existsSync(path.join(outDir, htmlPath))) {
      failures.push(`out/ is missing exported HTML for ${route} (${htmlPath})`)
    }
  }
}

if (failures.length) {
  console.error('Navigation integrity check failed:\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Navigation integrity check passed (${routes.size} routes).`)
