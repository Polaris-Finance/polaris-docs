import { Children, cloneElement, createElement, isValidElement } from 'react'
import { useMDXComponents as getThemeComponents } from 'nextra-theme-docs'
import { Image } from 'nextra/components'
import { pathWithBase } from './app/site-config.mjs'
import { AddressBlock } from './components/AddressBlock'
import { BlogPostCard } from './components/BlogPostCard'
import { BondingCurveExplorer } from './components/BondingCurveExplorer'
import { Breadcrumbs } from './components/Breadcrumbs'
import { Callout } from './components/Callout'
import { DefinitionCard } from './components/DefinitionCard'
import { DetailAccordion } from './components/DetailAccordion'
import { LaunchTimeline } from './components/LaunchTimeline'
import { NextSteps } from './components/NextSteps'
import { PageStatusBanner } from './components/PageStatusBanner'
import { ReadingTimeBadge } from './components/ReadingTimeBadge'
import { RiskChip } from './components/RiskChip'
import { Stepper } from './components/Stepper'
import { StickyMobileCta } from './components/StickyMobileCta'
import { SystemOverviewFigure } from './components/SystemOverviewFigure'
import { TroveSimulator } from './components/TroveSimulator'

const themeComponents = getThemeComponents()
const ThemeTable = themeComponents.table ?? 'table'
const ThemeTh = themeComponents.th ?? 'th'
const mdxAnchorClass =
  'x:focus-visible:nextra-focus x:text-primary-600 x:underline x:hover:no-underline x:decoration-from-font x:[text-underline-position:from-font]'

function hrefForMdxAnchor(href) {
  if (typeof href !== 'string') return href
  if (href.startsWith('#')) return href
  if (/^(?:https?:|mailto:|tel:)/.test(href)) return href
  if (href.startsWith(pathWithBase('/'))) return href
  if (href.startsWith('/') && !href.startsWith('//')) return pathWithBase(href)
  return href
}

function MdxAnchor({ href, className, rel, target, ...props }) {
  const external = typeof href === 'string' && /^https?:\/\//.test(href)

  return createElement('a', {
    ...props,
    href: hrefForMdxAnchor(href),
    className: [mdxAnchorClass, className].filter(Boolean).join(' '),
    rel: external ? (rel ?? 'noreferrer') : rel,
    target: external ? (target ?? '_blank') : target
  })
}

function getTextContent(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getTextContent).join(' ')
  if (isValidElement(node)) return getTextContent(node.props.children)
  return ''
}

function collectHeaderLabels(node, labels = []) {
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) return

    if (child.type === TableHeader || child.type === 'th') {
      const label = getTextContent(child.props.children).replace(/\s+/g, ' ').trim()
      if (label) labels.push(label)
    }

    collectHeaderLabels(child.props.children, labels)
  })

  return labels
}

function annotateRowCells(children, headers) {
  let cellIndex = 0

  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child

    if (child.type === 'td') {
      const label = headers[cellIndex] ?? ''
      cellIndex += 1
      return cloneElement(child, {
        'data-label': label || undefined,
        children: annotateTableChildren(child.props.children, headers, false)
      })
    }

    if (child.type === 'th') cellIndex += 1

    return cloneElement(child, {
      children: annotateTableChildren(child.props.children, headers, false)
    })
  })
}

function annotateTableChildren(node, headers, insideBody = false) {
  return Children.map(node, (child) => {
    if (!isValidElement(child)) return child

    if (child.type === 'tbody') {
      return cloneElement(child, {
        children: annotateTableChildren(child.props.children, headers, true)
      })
    }

    if (insideBody && child.type === 'tr') {
      return cloneElement(child, {
        children: annotateRowCells(child.props.children, headers)
      })
    }

    return cloneElement(child, {
      children: annotateTableChildren(child.props.children, headers, insideBody)
    })
  })
}

function TableHeader({ scope = 'col', ...props }) {
  return createElement(ThemeTh, { scope, ...props })
}

function AccessibleTable({ children, tabIndex = 0, ...props }) {
  const headers = collectHeaderLabels(children)
  const caption = headers.length ? `Table columns: ${headers.join(', ')}` : 'Data table'
  const isWide = headers.length >= 3

  return createElement(
    ThemeTable,
    {
      tabIndex,
      'aria-label': caption,
      'data-pl-table': 'true',
      'data-pl-wide': isWide ? 'true' : undefined,
      ...props
    },
    createElement('caption', { className: 'pl-table-caption' }, caption),
    annotateTableChildren(children, headers)
  )
}

// Merge Polaris-specific MDX component overrides into the docs theme components.
export function useMDXComponents(components) {
  return {
    ...themeComponents,
    // Plain image instead of Nextra's zoomable default: react-medium-image-zoom
    // stamps an aria-owns pointing at a modal that only exists once zoomed, which
    // fails axe's aria-valid-attr-value. `Image` keeps Pagefind alt/title indexing.
    img: Image,
    a: MdxAnchor,
    table: AccessibleTable,
    th: TableHeader,
    AddressBlock,
    BlogPostCard,
    BondingCurveExplorer,
    Breadcrumbs,
    Callout,
    DefinitionCard,
    DetailAccordion,
    LaunchTimeline,
    NextSteps,
    PageStatusBanner,
    ReadingTimeBadge,
    RiskChip,
    Stepper,
    StickyMobileCta,
    SystemOverviewFigure,
    TroveSimulator,
    ...components
  }
}
