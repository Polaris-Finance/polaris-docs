import {
  absoluteUrl,
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
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

export function buildPageMetadata(metadata, path) {
  const title = titleFromMetadata(metadata)
  const description = descriptionFromMetadata(metadata)

  return {
    ...metadata,
    title,
    description,
    alternates: {
      ...metadata.alternates,
      canonical: pathWithBase(path)
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
  const website = {
    '@context': 'https://schema.org',
    '@id': websiteId,
    '@type': 'WebSite',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    publisher: { '@id': organizationId }
  }

  if (SEARCH_URL_TEMPLATE) {
    website.potentialAction = {
      '@type': 'SearchAction',
      target: SEARCH_URL_TEMPLATE,
      'query-input': 'required name=search_term_string'
    }
  }

  return [
    {
      '@context': 'https://schema.org',
      '@id': organizationId,
      '@type': 'Organization',
      name: ORGANIZATION_NAME,
      url: 'https://polarisfinance.io',
      logo: absoluteUrl('/emblem.svg')
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
    '@type': 'BreadcrumbList',
    itemListElement
  }
}

export function buildTechArticleJsonLd({ metadata, path }) {
  const title = titleFromMetadata(metadata)
  const description = descriptionFromMetadata(metadata)

  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    inLanguage: 'en',
    publisher: { '@id': organizationId }
  }
}

export function extractFaqJsonLd(sourceCode, path) {
  if (path !== '/resources/faq') return null

  const lines = stripFrontmatter(sourceCode).split(/\r?\n/)
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
    const questionMatch = /^\*\*([^*?]+\?)\*\*$/.exec(trimmed)

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
    buildTechArticleJsonLd({ metadata, path }),
    extractFaqJsonLd(sourceCode, path)
  ].filter(Boolean)
}

export function metadataBase() {
  return new URL(SITE_URL)
}
