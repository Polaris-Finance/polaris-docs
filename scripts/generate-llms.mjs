import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs'
import path from 'node:path'
import { absoluteUrl } from '../app/site-config.mjs'

const root = process.cwd()
const contentDir = path.join(root, 'content')
const publicDir = path.join(root, 'public')
const sectionDir = path.join(publicDir, 'llms-sections')
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
  const route = routeForFile(fullPath)
  const keywords = vocabularyForRoute(route)

  return {
    title: titleMatch ? stripQuotes(titleMatch[1]) : 'Untitled',
    description: descMatch ? stripQuotes(descMatch[1]) : '',
    keywords,
    lastVerified: extractPageDate(frontmatter, body, ['lastVerified', 'last_verified']),
    updated: extractPageDate(frontmatter, body, ['updated', 'lastUpdated', 'date']),
    body: sanitizeMdxForLlms(body, route)
  }
}

function propValue(props, name) {
  const match = new RegExp(`${name}\\s*=\\s*(["'])(.*?)\\1`, 's').exec(props)
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

function renderImageAlt(props) {
  const alt = propValue(props, 'alt') || propValue(props, 'aria-label') || propValue(props, 'title')
  return alt ? `Image: ${alt}` : ''
}

function plainTextFromJsx(value) {
  return value
    .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_match, href, text) => {
      const label = plainTextFromJsx(text)
      return label ? `[${label}](${href})` : href
    })
    .replace(/<\/?p[^>]*>/gi, ' ')
    .replace(/<\/?strong[^>]*>/gi, '')
    .replace(/<\/?em[^>]*>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function linkForLlms(href) {
  if (/^https?:\/\//.test(href)) return href
  if (href.startsWith('/')) return absoluteUrl(href)
  return href
}

function renderDetailAccordion(props) {
  const itemsBlock = /items=\{\[([\s\S]*?)\]\}/.exec(props)?.[1] ?? props
  const items = [
    ...itemsBlock.matchAll(
      /(?:title|question):\s*(['"`])([\s\S]*?)\1\s*,\s*(?:content|answer):\s*([\s\S]*?)(?=\n\s*},|\n\s*}\s*\])/g
    )
  ]

  return items
    .map((match) => {
      const title = plainTextFromJsx(match[2])
      const body = plainTextFromJsx(match[3])
      return [title ? `### ${title}` : '', body].filter(Boolean).join('\n\n')
    })
    .filter(Boolean)
    .join('\n\n')
}

function renderNextSteps(props) {
  const stepsBlock = /steps=\{\[([\s\S]*?)\]\}/.exec(props)?.[1] ?? props
  const steps = [
    ...stepsBlock.matchAll(
      /href:\s*(['"])(.*?)\1\s*,\s*title:\s*(['"])(.*?)\3(?:\s*,\s*description:\s*(['"])(.*?)\5)?/g
    )
  ]

  if (!steps.length) return ''

  return [
    'Next steps:',
    ...steps.map((match) => {
      const href = linkForLlms(match[2])
      const title = match[4]
      const description = match[6] ? `: ${match[6]}` : ''
      return `- [${title}](${href})${description}`
    })
  ].join('\n')
}

function stripJsxTags(value) {
  return value
    .replace(/<BlogPostCard\s+([\s\S]*?)\/>/g, (_match, props) => renderBlogPostCard(props))
    .replace(/<DetailAccordion\s+([\s\S]*?)\/>/g, (_match, props) => renderDetailAccordion(props))
    .replace(/<NextSteps\s+([\s\S]*?)\/>/g, (_match, props) => renderNextSteps(props))
    .replace(
      /<LaunchTimeline\s*\/>/g,
      'Image: Polaris launch timeline. Early Research in 2024. Team Formation in June 2025. Testnet 1, private, March 2026. Testnet 2, public, May 2026, the current phase. Mainnet, forthcoming.'
    )
    .replace(
      /<SystemOverviewFigure\s*\/>/g,
      'Image: Polaris system overview: ETH swaps into pETH on the bonding curve, pETH collateralizes CDPs that mint pUSD, and burning pETH for POLAR raises the floor and releases ETH.'
    )
    .replace(
      /<TimedExplainers\s*\/>/g,
      [
        'Timed explainers:',
        '- [Overview](/explainers/2-min): 2 min read.',
        '- [Presentation](/explainers/5-min): 5 min read.',
        '- [Full Introduction](/explainers/10-min): 10 min read.'
      ].join('\n')
    )
    .replace(/<img\s+([^>]*?)\/?>/gi, (_match, props) => renderImageAlt(props))
    .replace(/<Image\s+([^>]*?)\/?>/g, (_match, props) => renderImageAlt(props))
    .replace(/!\[([^\]]*)]\([^)]+\)/g, (_match, alt) => (alt ? `Image: ${alt}` : ''))
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/^\s*(import|export)\s.+$/gm, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<[^>\n]+\/>/g, '')
    .replace(/<\/?(?:Steps|Callout|div|span|a|figure|figcaption)[^>]*>/g, '')
    .replace(/<\/?[A-Z][^>]*>/g, '')
    .replace(/<\/?[a-z][^>]*\s(?:class|className|style)=["'][^"']*["'][^>]*>/gi, '')
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

function appendVocabulary(body, route) {
  const keywords = vocabularyForRoute(route)
  if (!keywords.length) return body
  return `${body.trim()}\n\nRelevant app/search vocabulary: ${keywords.join(', ')}.`
}

function absolutizeMarkdownLinks(value, route) {
  return value
    .replace(/\]\((#[^)]+)\)/g, (_match, hash) => `](${absoluteUrl(`${route}${hash}`)})`)
    .replace(/\]\((\/[^)\s]+)\)/g, (_match, href) => `](${absoluteUrl(href)})`)
}

function sanitizeMdxForLlms(body, route) {
  return appendVocabulary(
    absolutizeMarkdownLinks(normalizeTables(stripJsxTags(body)), route),
    route
  )
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
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
  const forbidden = [
    /<style/i,
    /className=/,
    /\bstyle=/,
    /^\s*import\s/m,
    /^\s*export\s/m,
    /<svg[\s>]/i
  ]
  return forbidden
    .filter((pattern) => pattern.test(value))
    .map((pattern) => `llms-full.txt contains ${pattern}`)
}

const routeVocabulary = [
  {
    match: /^\/$/,
    terms: ['app', 'official app', 'testnet', 'Testnet 2', 'Sepolia', 'pETH', 'pAssets']
  },
  {
    match: /^\/launch-status$/,
    terms: [
      'app',
      'official app',
      'testnet app',
      'app.testnet.polarisfinance.io',
      'testnet',
      'Testnet 2',
      'Sepolia',
      'chain ID 11155111',
      'WETH faucet',
      'contracts',
      'audits'
    ]
  },
  {
    match: /^\/getting-started$/,
    terms: [
      'app',
      'official app',
      'connect wallet',
      'testnet',
      'Sepolia',
      'Sepolia ETH',
      'WETH faucet',
      'borrow',
      'earn',
      'swap'
    ]
  },
  {
    match: /^\/paths$/,
    terms: ['Dashboard', 'Swap', 'Borrow', 'Earn', 'Split', 'Zap', 'Guide', 'Advanced', 'Analytics']
  },
  {
    match: /^\/paths\/safety-verification$/,
    terms: ['official app', 'app URL', 'phishing', 'verify contracts', 'testnet', 'mainnet']
  },
  {
    match:
      /^\/paths\/borrow-passets$|^\/minting\/(open-a-trove|minting-passets|managing-your-trove)$/,
    terms: ['Borrow', 'borrow', 'mint', 'open trove', 'pUSD', 'pGOLD', 'ICR', 'official app']
  },
  {
    match: /^\/paths\/earn-yield$|^\/yield\//,
    terms: ['Earn', 'earn', 'yield', 'APR', 'Stability Pool', 'deposit', 'claim rewards']
  },
  {
    match: /^\/peth\/(bonding-curve|floor-price)$|^\/paths\/hold-use-peth$/,
    terms: ['Swap', 'swap', 'Split', 'fpETH', 'vpETH', 'pETH', 'floor price']
  },
  {
    match: /^\/resources\/(glossary|contracts|faq)$/,
    terms: [
      'app',
      'official app',
      'testnet',
      'Sepolia',
      'WETH',
      'WETH faucet',
      'Zap',
      'Split',
      'Swap',
      'Borrow',
      'Earn',
      'Guide',
      'Advanced',
      'Analytics',
      'APR',
      'Reserve Loan'
    ]
  },
  {
    match: /^\/polar\/(participate-in-conversion|conversion-auctions|polar-token)$/,
    terms: ['POLAR', 'convert', 'lock', 'vePOLAR', 'burn pETH', 'conversion auction']
  }
]

function vocabularyForRoute(route) {
  const terms = new Set()
  for (const entry of routeVocabulary) {
    if (entry.match.test(route)) {
      for (const term of entry.terms) terms.add(term)
    }
  }
  return [...terms]
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

function extractPageDate(frontmatter, body, names) {
  for (const name of names) {
    const frontmatterMatch = new RegExp(`^${name}:\\s*["']?([^"']+)["']?\\s*$`, 'im').exec(
      frontmatter
    )
    if (frontmatterMatch) {
      const date = normalizeDate(frontmatterMatch[1])
      if (date) return date
    }
  }

  if (names.some((name) => /last[_-]?verified/i.test(name))) {
    const bodyMatch = /\*\*Last verified:\*\*\s*([^.\n]+)/i.exec(body)
    if (bodyMatch) return normalizeDate(bodyMatch[1])
  }

  return null
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
if (!checkOnly) {
  rmSync(sectionDir, { recursive: true, force: true })
}
mkdirSync(sectionDir, { recursive: true })

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

function sectionSlug(section) {
  return section === '' ? 'overview' : section.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
}

const sectionArtifacts = orderedSections.map((section) => {
  const heading = section === '' ? overviewTitle : (sectionTitles[section] ?? section)
  const body = grouped
    .get(section)
    .map(({ route, title, body }) => `## ${title}\n\nURL: ${absoluteUrl(route)}\n\n${body}`)
    .join('\n\n---\n\n')

  return {
    relativePath: `llms-sections/${sectionSlug(section)}.txt`,
    content: `${header}\n# ${heading}\n\n${body}\n`
  }
})

const llmsIndex = `${JSON.stringify(
  {
    site: absoluteUrl('/'),
    pages: pages.map(({ route, section, title, description, keywords, updated, lastVerified }) => ({
      route,
      url: absoluteUrl(route),
      section: section === '' ? overviewTitle : (sectionTitles[section] ?? section),
      title,
      description,
      keywords,
      updated,
      lastVerified
    }))
  },
  null,
  2
)}\n`

const failures = [
  checkOrWrite('llms.txt', llms),
  checkOrWrite('llms-full.txt', llmsFull),
  checkOrWrite('llms-index.json', llmsIndex),
  ...sectionArtifacts.map(({ relativePath, content }) => checkOrWrite(relativePath, content)),
  ...validateCleanLlmsFull(llmsFull)
].filter(Boolean)

if (failures.length) {
  console.error('Generated LLM artifacts are stale or noisy:\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  checkOnly
    ? `LLM artifacts are fresh and clean (${pages.length} pages, ${sectionArtifacts.length} sections).`
    : `Generated llms.txt, llms-full.txt, llms-index.json, and ${sectionArtifacts.length} section files with ${pages.length} pages.`
)
