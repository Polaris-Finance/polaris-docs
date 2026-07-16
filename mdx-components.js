import { Children, cloneElement, createElement, isValidElement } from 'react'
import { useMDXComponents as getThemeComponents } from 'nextra-theme-docs'
import { Image } from 'nextra/components'
import { hrefWithBase, isExternalHref } from './app/site-config.mjs'

const themeComponents = getThemeComponents()
const ThemeTable = themeComponents.table ?? 'table'
const ThemeTh = themeComponents.th ?? 'th'
// Nextra maps td/tr to Table.Td/Table.Tr components, so the cell/row elements
// reaching AccessibleTable have those component types — not the string literals.
// Match both so the responsive-card data-label annotation actually applies.
const ThemeTd = themeComponents.td ?? 'td'
const ThemeTr = themeComponents.tr ?? 'tr'
const mdxAnchorClass =
  'x:focus-visible:nextra-focus x:text-primary-600 x:underline x:hover:no-underline x:decoration-from-font x:[text-underline-position:from-font]'

function hrefForMdxAnchor(href) {
  return hrefWithBase(href)
}

function MdxAnchor({ href, className, rel, target, ...props }) {
  const external = isExternalHref(href)

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

    if (child.type === 'td' || child.type === ThemeTd) {
      const label = headers[cellIndex] ?? ''
      cellIndex += 1
      return cloneElement(child, {
        'data-label': label || undefined,
        children: annotateTableChildren(child.props.children, headers, false)
      })
    }

    if (child.type === 'th' || child.type === ThemeTh || child.type === TableHeader) cellIndex += 1

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

    if (insideBody && (child.type === 'tr' || child.type === ThemeTr)) {
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
    ...components
  }
}
