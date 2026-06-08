import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
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
      entries.push(fullPath)
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

function topLevel(fullPath) {
  const rel = path.relative(contentDir, fullPath).replace(/\\/g, '/')
  const index = rel.indexOf('/')
  return index === -1 ? '' : rel.slice(0, index)
}

function parsePage(fullPath) {
  const text = readFileSync(fullPath, 'utf8')
  let frontmatter = ''
  let body = text
  if (text.startsWith('---\n')) {
    const end = text.indexOf('\n---', 4)
    if (end !== -1) {
      frontmatter = text.slice(4, end)
      body = text.slice(end + '\n---'.length).replace(/^\r?\n/, '')
    }
  }
  const titleMatch = /^title:\s*(.+?)\s*$/im.exec(frontmatter)
  const descMatch = /^description:\s*(.+?)\s*$/im.exec(frontmatter)
  const stripQuotes = (value) => value.replace(/^["']|["']$/g, '')
  return {
    title: titleMatch ? stripQuotes(titleMatch[1]) : 'Untitled',
    description: descMatch ? stripQuotes(descMatch[1]) : '',
    body: sanitizeMdxForLlms(body)
  }
}

function propValue(props, name) {
  const match = new RegExp(`${name}=(["'])(.*?)\\1`, 's').exec(props)
  return match?.[2]?.trim() ?? ''
}

function renderBlogPostCard(props) {
  const title = propValue(props, 'title')
  const description = propValue(props, 'description')
  const url = propValue(props, 'url')

  if (!title && !description) return ''

  const heading = url ? `[${title || 'Related article'}](${url})` : title
  return [heading, description].filter(Boolean).join('\n')
}

function stripJsxTags(value) {
  return value
    .replace(/<BlogPostCard\s+([\s\S]*?)\/>/g, (_match, props) => renderBlogPostCard(props))
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/^\s*(import|export)\s.+$/gm, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<[^>\n]+\/>/g, '')
    .replace(/<\/?(?:Steps|Callout|div|span|a)[^>]*>/g, '')
    .replace(/<\/?[A-Z][^>]*>/g, '')
}

function normalizeTables(value) {
  return value
    .split('\n')
    .map((line) => {
      if (!line.trim().startsWith('|')) return line
      if (/^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim())) return ''
      return line
        .split('|')
        .map((cell) => cell.trim())
        .filter(Boolean)
        .join(' | ')
    })
    .join('\n')
}

function sanitizeMdxForLlms(body) {
  return normalizeTables(stripJsxTags(body))
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
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

function validateCleanLlmsFull(value) {
  const forbidden = [/<style/i, /className=/, /^\s*import\s/m, /^\s*export\s/m]
  return forbidden
    .filter((pattern) => pattern.test(value))
    .map((pattern) => `llms-full.txt contains ${pattern}`)
}

// Section titles for top-level areas, taken from the navigation order in
// content/_meta.js so llms.txt mirrors the published information architecture.
const sectionTitles = {
  explainers: 'Explainers',
  paths: 'Choose Your Path',
  minting: 'Minting & Troves',
  peth: 'pETH & Bonding Curve',
  yield: 'Earning Yield',
  'redemptions-liquidations': 'Redemptions & Liquidations',
  polar: 'POLAR & Conversion',
  stewardship: 'Stewardship',
  resources: 'Resources',
  developers: 'Developers'
}
const sectionOrder = ['', ...Object.keys(sectionTitles)]
const overviewTitle = 'Overview'

mkdirSync(publicDir, { recursive: true })

const pages = walk(contentDir)
  .map((fullPath) => ({
    route: routeForFile(fullPath),
    section: topLevel(fullPath),
    ...parsePage(fullPath)
  }))
  .sort((a, b) => a.route.localeCompare(b.route))

const grouped = new Map()
for (const page of pages) {
  if (!grouped.has(page.section)) grouped.set(page.section, [])
  grouped.get(page.section).push(page)
}

const orderedSections = [
  ...sectionOrder.filter((key) => grouped.has(key)),
  ...[...grouped.keys()].filter((key) => !sectionOrder.includes(key)).sort()
]

const header = `# Polaris Documentation\n\n> User and developer documentation for Polaris Finance — the self-scaling stablecoin operating system. Mint pAssets backed entirely by onchain collateral and yield. No T-bills. No CEXs. No compromises.\n`

const indexBody = orderedSections
  .map((section) => {
    const heading = section === '' ? overviewTitle : (sectionTitles[section] ?? section)
    const lines = grouped
      .get(section)
      .map(({ route, title, description }) => {
        const suffix = description ? `: ${description}` : ''
        return `- [${title}](${absoluteUrl(route)})${suffix}`
      })
      .join('\n')
    return `## ${heading}\n\n${lines}`
  })
  .join('\n\n')

const llms = `${header}\n${indexBody}\n`

const fullBody = orderedSections
  .map((section) =>
    grouped
      .get(section)
      .map(({ route, title, body }) => `## ${title}\n\nURL: ${absoluteUrl(route)}\n\n${body}`)
      .join('\n\n---\n\n')
  )
  .join('\n\n---\n\n')

const llmsFull = `${header}\n${fullBody}\n`

const failures = [
  checkOrWrite('llms.txt', llms),
  checkOrWrite('llms-full.txt', llmsFull),
  ...validateCleanLlmsFull(llmsFull)
].filter(Boolean)

if (failures.length) {
  console.error('Generated LLM artifacts are stale or noisy:\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  checkOnly
    ? `LLM artifacts are fresh and clean (${pages.length} pages).`
    : `Generated llms.txt and llms-full.txt with ${pages.length} pages.`
)
