import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const contentDir = path.join(root, 'content')
const publicDir = path.join(root, 'public')
const baseUrl = 'https://docs.polarisfinance.io'

function walk(dir) {
  const entries = []
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      entries.push(...walk(fullPath))
    } else if (entry.endsWith('.mdx')) {
      entries.push({ fullPath, stat })
    }
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

function xmlEscape(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

mkdirSync(publicDir, { recursive: true })

const urls = walk(contentDir)
  .map(({ fullPath, stat }) => ({
    loc: `${baseUrl}${routeForFile(fullPath)}`,
    lastmod: stat.mtime.toISOString().slice(0, 10),
    priority: routeForFile(fullPath) === '/' ? '1.0' : '0.7'
  }))
  .sort((a, b) => a.loc.localeCompare(b.loc))

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map(
    ({ loc, lastmod, priority }) =>
      `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  )
  .join('\n')}\n</urlset>\n`

const robots = `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`

writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap)
writeFileSync(path.join(publicDir, 'robots.txt'), robots)

console.log(`Generated sitemap.xml with ${urls.length} URLs.`)
