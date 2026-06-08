import { Children, createElement, isValidElement } from 'react'
import { useMDXComponents as getThemeComponents } from 'nextra-theme-docs'
import { Image } from 'nextra/components'
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
import { TimedExplainers } from './components/TimedExplainers'
import { TroveSimulator } from './components/TroveSimulator'

const themeComponents = getThemeComponents()
const ThemeTable = themeComponents.table ?? 'table'
const ThemeTh = themeComponents.th ?? 'th'

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

function TableHeader({ scope = 'col', ...props }) {
  return createElement(ThemeTh, { scope, ...props })
}

function AccessibleTable({ children, tabIndex = 0, ...props }) {
  const headers = collectHeaderLabels(children)
  const caption = headers.length ? `Table columns: ${headers.join(', ')}` : 'Data table'

  return createElement(
    ThemeTable,
    { tabIndex, 'data-pl-table': 'true', ...props },
    createElement('caption', { className: 'pl-sr-only' }, caption),
    children
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
    TimedExplainers,
    TroveSimulator,
    ...components
  }
}
