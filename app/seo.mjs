import {
  absoluteUrl,
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  markdownPathForRoute,
  ORGANIZATION_NAME,
  pathWithBase,
  SEARCH_URL_TEMPLATE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL
} from './site-config.mjs'

const organizationId = `${absoluteUrl('/')}#organization`
const websiteId = `${absoluteUrl('/')}#website`

function ogImages() {
  return [
    {
      url: absoluteUrl(OG_IMAGE_PATH),
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      alt: OG_IMAGE_ALT
    }
  ]
}

function titleFromMetadata(metadata) {
  if (typeof metadata.title === 'string') return metadata.title
  return SITE_TITLE
}

function descriptionFromMetadata(metadata) {
  return metadata.description ?? SITE_DESCRIPTION
}

function readableSegment(segment) {
  const specialCases = new Map([
    ['peth', 'pETH'],
    ['polar', 'POLAR'],
    ['vepolar', 'vePOLAR'],
    ['faq', 'FAQ'],
    ['redemptions-liquidations', 'Redemptions & Liquidations']
  ])

  if (specialCases.has(segment)) return specialCases.get(segment)

  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function stripMarkdown(value) {
  return value
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripFrontmatter(sourceCode) {
  if (!sourceCode?.startsWith('---\n')) return sourceCode ?? ''
  const end = sourceCode.indexOf('\n---', 4)
  if (end === -1) return sourceCode
  return sourceCode.slice(end + '\n---'.length).replace(/^\r?\n/, '')
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
  if (!value) return null
  const iso = /\b(\d{4}-\d{2}-\d{2})\b/.exec(String(value))
  if (iso) return iso[1]

  const written = /\b([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})\b/.exec(String(value))
  if (!written) return null

  const month = monthNumbers.get(written[1].toLowerCase())
  if (!month) return null

  return `${written[3]}-${month}-${written[2].padStart(2, '0')}`
}

function metadataDate(metadata, names) {
  for (const name of names) {
    const date = normalizeDate(metadata?.[name])
    if (date) return date
  }
  return null
}

function frontmatterDate(sourceCode, names) {
  if (!sourceCode?.startsWith('---\n')) return null
  const end = sourceCode.indexOf('\n---', 4)
  if (end === -1) return null
  const frontmatter = sourceCode.slice(4, end)

  for (const name of names) {
    const match = new RegExp(`^${name}:\\s*["']?([^"']+)["']?\\s*$`, 'im').exec(frontmatter)
    if (!match) continue
    const date = normalizeDate(match[1])
    if (date) return date
  }

  return null
}

function lastVerifiedDate(sourceCode) {
  const match = /\*\*Last verified:\*\*\s*([^.\n]+)/i.exec(stripFrontmatter(sourceCode))
  return match ? normalizeDate(match[1]) : null
}

function timestampDate(metadata) {
  const timestamp = Number(metadata?.timestamp)
  if (!Number.isFinite(timestamp)) return null
  return new Date(timestamp).toISOString().slice(0, 10)
}

function pageFreshness(metadata, sourceCode) {
  const published =
    metadataDate(metadata, ['date', 'published', 'datePublished']) ??
    frontmatterDate(sourceCode, ['date', 'published', 'datePublished'])

  const modified =
    metadataDate(metadata, ['updated', 'lastUpdated', 'lastVerified', 'dateModified']) ??
    frontmatterDate(sourceCode, ['updated', 'lastUpdated', 'lastVerified', 'dateModified']) ??
    lastVerifiedDate(sourceCode) ??
    timestampDate(metadata)

  return {
    datePublished: published,
    dateModified: modified
  }
}

function crawlableSearchTemplate(value) {
  if (!value || !value.includes('{search_term_string}')) return null

  try {
    const url = new URL(value.replace('{search_term_string}', 'polaris'), absoluteUrl('/'))
    if (!/^https?:$/.test(url.protocol)) return null
    if (url.pathname.includes('_pagefind')) return null
    if (!url.search && !value.includes('{search_term_string}')) return null
    return value
  } catch {
    return null
  }
}

function jsonLdImage() {
  return {
    '@type': 'ImageObject',
    url: absoluteUrl(OG_IMAGE_PATH),
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    caption: OG_IMAGE_ALT
  }
}

export function buildPageMetadata(metadata, path) {
  const title = titleFromMetadata(metadata)
  const description = descriptionFromMetadata(metadata)

  return {
    ...metadata,
    title,
    description,
    alternates: {
      ...metadata.alternates,
      canonical: pathWithBase(path),
      types: {
        'text/markdown': [
          { url: pathWithBase(markdownPathForRoute(path)), title: `Markdown: ${title}` },
          { url: pathWithBase('/llms.txt'), title: 'llms.txt' },
          { url: pathWithBase('/llms-full.txt'), title: 'llms-full.txt' }
        ],
        'application/json': [
          { url: pathWithBase('/llms-index.json'), title: 'LLM docs index' },
          {
            url: pathWithBase('/polaris-testnet-manifest.json'),
            title: 'Polaris testnet manifest'
          }
        ]
      }
    },
    openGraph: {
      ...metadata.openGraph,
      title,
      description,
      url: pathWithBase(path),
      type: path === '/' ? 'website' : 'article',
      siteName: SITE_NAME,
      images: ogImages()
    },
    twitter: {
      ...metadata.twitter,
      card: 'summary_large_image',
      title,
      description,
      images: [
        {
          url: absoluteUrl(OG_IMAGE_PATH),
          alt: OG_IMAGE_ALT
        }
      ]
    }
  }
}

export function buildGlobalJsonLd() {
  const searchTemplate = crawlableSearchTemplate(SEARCH_URL_TEMPLATE)
  const website = {
    '@context': 'https://schema.org',
    '@id': websiteId,
    '@type': 'WebSite',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    inLanguage: 'en',
    publisher: { '@id': organizationId }
  }

  if (searchTemplate) {
    website.potentialAction = {
      '@type': 'SearchAction',
      target: searchTemplate,
      'query-input': 'required name=search_term_string'
    }
  }

  return [
    {
      '@context': 'https://schema.org',
      '@id': organizationId,
      '@type': 'Organization',
      name: ORGANIZATION_NAME,
      alternateName: 'Polaris',
      description: SITE_DESCRIPTION,
      url: 'https://polarisfinance.io',
      // Official profiles, so answer engines can disambiguate Polaris
      // from other projects named Polaris.
      sameAs: [
        'https://polarisfinance.io',
        'https://x.com/polarisfinance_',
        'https://t.me/polaris_ann',
        'https://github.com/Polaris-Finance'
      ],
      knowsAbout: ['pETH', 'pAssets', 'USDp', 'POLAR', 'pAsset issuance', 'bonding curve'],
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/favicon.png'),
        width: 192,
        height: 192
      }
    },
    website
  ]
}

export function buildBreadcrumbJsonLd(path, title) {
  const segments = path.split('/').filter(Boolean)
  const itemListElement = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: absoluteUrl('/')
    }
  ]

  segments.forEach((segment, index) => {
    const isCurrentPage = index === segments.length - 1
    const route = `/${segments.slice(0, index + 1).join('/')}`
    itemListElement.push({
      '@type': 'ListItem',
      position: index + 2,
      name: isCurrentPage ? title : readableSegment(segment),
      item: absoluteUrl(route)
    })
  })

  return {
    '@context': 'https://schema.org',
    '@id': `${absoluteUrl(path)}#breadcrumb`,
    '@type': 'BreadcrumbList',
    itemListElement
  }
}

export function buildTechArticleJsonLd({ metadata, path, sourceCode }) {
  const title = titleFromMetadata(metadata)
  const description = descriptionFromMetadata(metadata)
  const pageUrl = absoluteUrl(path)
  const freshness = pageFreshness(metadata, sourceCode)
  const article = {
    '@context': 'https://schema.org',
    '@id': `${pageUrl}#techarticle`,
    '@type': 'TechArticle',
    headline: title,
    description,
    url: pageUrl,
    mainEntityOfPage: { '@id': pageUrl },
    inLanguage: 'en',
    author: { '@id': organizationId },
    publisher: { '@id': organizationId },
    image: jsonLdImage(),
    isPartOf: { '@id': websiteId }
  }

  if (freshness.datePublished) article.datePublished = freshness.datePublished
  if (freshness.dateModified) article.dateModified = freshness.dateModified

  const section = path.split('/').filter(Boolean)[0]
  if (section) article.articleSection = readableSegment(section)

  return article
}

export function extractFaqJsonLd(sourceCode, path) {
  if (path !== '/resources/faq') return null

  const body = stripFrontmatter(sourceCode)
  const accordionPairs = [
    ...body.matchAll(
      /question:\s*(['"`])([\s\S]*?)\1\s*,\s*answer:\s*([\s\S]*?)(?=\n\s*},|\n\s*}\s*\])/g
    )
  ]
    .map((match) => ({
      question: stripMarkdown(match[2]),
      answer: stripMarkdown(match[3])
    }))
    .filter(({ question, answer }) => question && answer)

  if (accordionPairs.length) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: accordionPairs.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer
        }
      }))
    }
  }

  const lines = body.split(/\r?\n/)
  const pairs = []
  let current = null

  const finishCurrent = () => {
    if (!current) return
    const answer = stripMarkdown(current.answer.join(' '))
    if (current.question && answer) {
      pairs.push({
        '@type': 'Question',
        name: current.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer
        }
      })
    }
    current = null
  }

  for (const line of lines) {
    const trimmed = line.trim()
    const questionMatch = /^###\s+(.+\?)\s*$/.exec(trimmed) ?? /^\*\*([^*?]+\?)\*\*$/.exec(trimmed)

    if (questionMatch) {
      finishCurrent()
      current = {
        question: stripMarkdown(questionMatch[1]),
        answer: []
      }
      continue
    }

    if (!current) continue
    if (!trimmed || trimmed.startsWith('## ')) continue
    if (trimmed === '---') {
      finishCurrent()
      continue
    }
    current.answer.push(trimmed)
  }

  finishCurrent()

  if (!pairs.length) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pairs
  }
}

export function buildPageJsonLd({ metadata, path, sourceCode }) {
  const title = titleFromMetadata(metadata)

  return [
    buildBreadcrumbJsonLd(path, title),
    buildTechArticleJsonLd({ metadata, path, sourceCode }),
    extractFaqJsonLd(sourceCode, path)
  ].filter(Boolean)
}

export function metadataBase() {
  return new URL(SITE_URL)
}
