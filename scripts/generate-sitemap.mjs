import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { absoluteUrl } from '../app/site-config.mjs'

const root = process.cwd()
const contentDir = path.join(root, 'content')
const publicDir = path.join(root, 'public')
const checkOnly = process.argv.includes('--check')

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

function frontmatterUpdated(fullPath) {
  const text = readFileSync(fullPath, 'utf8')
  if (!text.startsWith('---\n')) return null
  const end = text.indexOf('\n---', 4)
  if (end === -1) return null
  const frontmatter = text.slice(4, end)
  const match = /^(?:updated|lastUpdated|date):\s*["']?(\d{4}-\d{2}-\d{2})/im.exec(frontmatter)
  return match?.[1] ?? null
}

function gitLastModified(fullPath) {
  try {
    const relativePath = path.relative(root, fullPath)
    const value = execFileSync('git', ['log', '-1', '--format=%cI', '--', relativePath], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()

    return value ? value.slice(0, 10) : null
  } catch {
    return null
  }
}

function lastModified(fullPath) {
  return frontmatterUpdated(fullPath) ?? gitLastModified(fullPath)
}

function checkOrWrite(relativePath, nextContent) {
  const target = path.join(publicDir, relativePath)

  if (!checkOnly) {
    writeFileSync(target, nextContent)
    return null
  }

  if (!existsSync(target)) return `${relativePath} is missing`

  const currentContent = readFileSync(target, 'utf8')
  if (currentContent !== nextContent) return `${relativePath} is stale`

  return null
}

mkdirSync(publicDir, { recursive: true })

const urls = walk(contentDir)
  .map(({ fullPath }) => ({
    loc: absoluteUrl(routeForFile(fullPath)),
    lastmod: lastModified(fullPath),
    priority: routeForFile(fullPath) === '/' ? '1.0' : '0.7'
  }))
  .sort((a, b) => a.loc.localeCompare(b.loc))

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map(
    ({ loc, lastmod, priority }) =>
      `  <url>\n    <loc>${xmlEscape(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  )
  .join('\n')}\n</urlset>\n`

const robots = `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('/sitemap.xml')}\n`

const failures = [checkOrWrite('sitemap.xml', sitemap), checkOrWrite('robots.txt', robots)].filter(
  Boolean
)

if (failures.length) {
  console.error('Generated sitemap artifacts are stale:\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  checkOnly
    ? `Sitemap artifacts are fresh (${urls.length} URLs).`
    : `Generated sitemap.xml with ${urls.length} URLs.`
)
