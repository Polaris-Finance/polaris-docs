import fs from 'node:fs'
import path from 'node:path'
import { fileForRoute, lastModifiedForFile } from '../scripts/lib/content.mjs'
import {
  absoluteUrl,
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  markdownPathForRoute,
  ogImagePathForRoute,
  ORGANIZATION_NAME,
  ORGANIZATION_URL,
  pathWithBase,
  SEARCH_URL_TEMPLATE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL
} from './site-config.mjs'

const organizationId = `${absoluteUrl('/')}#organization`
const websiteId = `${absoluteUrl('/')}#website`
const contentDir = path.join(process.cwd(), 'content')

// Real page routes derived from content/*.mdx the same way the router maps
// files. Google requires every non-final Breadcrumb ListItem to have a real
// item URL, so pageless folder segments are omitted from structured data.
const CONTENT_ROUTES = collectContentRoutes()

function collectContentRoutes() {
  const contentDir = path.join(process.cwd(), 'content')
  const routes = new Set(['/'])
  const walk = (dir, prefix) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), `${prefix}/${entry.name}`)
      } else if (entry.name.endsWith('.mdx')) {
        const name = entry.name.replace(/\.mdx$/, '')
        routes.add(name === 'index' ? prefix || '/' : `${prefix}/${name}`)
      }
    }
  }
  walk(contentDir, '')
  return routes
}

function ogImages(path = '/') {
  return [
    {
      url: absoluteUrl(ogImagePathForRoute(path)),
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
    ['architecture', 'Core Architecture'],
    ['design', 'Protocol Mechanics'],
    ['testnet', 'Testnet Guide'],
    ['passet-markets', 'pAsset Markets']
  ])

  if (specialCases.has(segment)) return specialCases.get(segment)

  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function pageModified(pathname) {
  return lastModifiedForFile(fileForRoute(contentDir, pathname))
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
          { url: pathWithBase(markdownPathForRoute(path)), title: `Markdown: ${title}` }
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
      images: ogImages(path)
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
      url: ORGANIZATION_URL,
      // Official profiles, so answer engines can disambiguate Polaris
      // from other projects named Polaris.
      sameAs: [
        ORGANIZATION_URL,
        'https://x.com/polarisfinance_',
        'https://t.me/polaris_ann',
        'https://github.com/Polaris-Finance'
      ],
      knowsAbout: ['pETH', 'pAssets', 'USDp', 'POLAR', 'pAsset minting', 'bonding curve'],
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
  if (path === '/') return null

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
    if (!isCurrentPage && !CONTENT_ROUTES.has(route)) return

    const listItem = {
      '@type': 'ListItem',
      position: itemListElement.length + 1,
      name: isCurrentPage ? title : readableSegment(segment)
    }
    listItem.item = absoluteUrl(route)
    itemListElement.push(listItem)
  })

  return {
    '@context': 'https://schema.org',
    '@id': `${absoluteUrl(path)}#breadcrumb`,
    '@type': 'BreadcrumbList',
    itemListElement
  }
}

export function buildTechArticleJsonLd({ metadata, path }) {
  const title = titleFromMetadata(metadata)
  const description = descriptionFromMetadata(metadata)
  const pageUrl = absoluteUrl(path)
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
    isPartOf: { '@id': websiteId },
    dateModified: pageModified(path)
  }

  const section = path.split('/').filter(Boolean)[0]
  if (section) article.articleSection = readableSegment(section)

  return article
}

function buildCollectionPageJsonLd(metadata) {
  return {
    '@context': 'https://schema.org',
    '@id': `${absoluteUrl('/')}#webpage`,
    '@type': 'CollectionPage',
    name: titleFromMetadata(metadata),
    description: descriptionFromMetadata(metadata),
    url: absoluteUrl('/'),
    inLanguage: 'en',
    publisher: { '@id': organizationId },
    image: jsonLdImage(),
    isPartOf: { '@id': websiteId },
    dateModified: pageModified('/')
  }
}

export function buildPageJsonLd({ metadata, path }) {
  const title = titleFromMetadata(metadata)

  return [
    buildBreadcrumbJsonLd(path, title),
    path === '/' ? buildCollectionPageJsonLd(metadata) : buildTechArticleJsonLd({ metadata, path })
  ].filter(Boolean)
}

export function metadataBase() {
  return new URL(SITE_URL)
}
