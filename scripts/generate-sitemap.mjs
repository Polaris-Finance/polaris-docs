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
  return (
    extractFrontmatterDate(frontmatter, ['updated', 'lastUpdated', 'lastVerified', 'date']) ??
    extractLastVerifiedDate(text.slice(end + '\n---'.length))
  )
}

const monthNumbers = new Map([
  ['january', '01'],
  ['february', '02'],
  ['march', '03'],
  ['april', '04'],
  ['may', '05'],
  ['june', '06'],
  ['july', '07'],
  ['august', '08'],
  ['september', '09'],
  ['october', '10'],
  ['november', '11'],
  ['december', '12']
])

function normalizeDate(value) {
  const iso = /\b(\d{4}-\d{2}-\d{2})\b/.exec(value)
  if (iso) return iso[1]

  const written = /\b([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})\b/.exec(value)
  if (!written) return null

  const month = monthNumbers.get(written[1].toLowerCase())
  if (!month) return null

  return `${written[3]}-${month}-${written[2].padStart(2, '0')}`
}

function extractFrontmatterDate(frontmatter, names) {
  for (const name of names) {
    const match = new RegExp(`^${name}:\\s*["']?([^"']+)["']?\\s*$`, 'im').exec(frontmatter)
    if (!match) continue
    const date = normalizeDate(match[1])
    if (date) return date
  }
  return null
}

function extractLastVerifiedDate(body) {
  const match = /\*\*Last verified:\*\*\s*([^.\n]+)/i.exec(body)
  return match ? normalizeDate(match[1]) : null
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

function sitemapPolicy(route) {
  if (route === '/') return { changefreq: 'weekly', priority: '1.0' }

  const volatileRoutes = new Set([
    '/launch-status',
    '/paths/safety-verification',
    '/resources/contracts',
    '/resources/audits-security',
    '/resources/faq',
    '/resources/testnet'
  ])

  if (volatileRoutes.has(route)) {
    return { changefreq: 'daily', priority: '0.9' }
  }

  if (
    /^\/paths(\/|$)/.test(route) ||
    /^\/minting\/(open-a-trove|minting-passets|managing-your-trove)$/.test(route) ||
    /^\/yield\/deposit-to-stability-pool$/.test(route) ||
    /^\/polar\/participate-in-conversion$/.test(route) ||
    /^\/redemptions-liquidations\/(redemptions|liquidations|recovery-mode)$/.test(route)
  ) {
    return { changefreq: 'weekly', priority: '0.8' }
  }

  if (/^\/resources\/(risk-disclosure|brand-assets|glossary)$/.test(route)) {
    return { changefreq: 'monthly', priority: '0.7' }
  }

  return { changefreq: 'monthly', priority: '0.6' }
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
  .map(({ fullPath }) => {
    const route = routeForFile(fullPath)
    return {
      loc: absoluteUrl(route),
      lastmod: lastModified(fullPath),
      ...sitemapPolicy(route)
    }
  })
  .sort((a, b) => a.loc.localeCompare(b.loc))

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map(
    ({ loc, lastmod, changefreq, priority }) =>
      `  <url>\n    <loc>${xmlEscape(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
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
