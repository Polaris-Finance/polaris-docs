import { Children, cloneElement, isValidElement } from 'react'
import { hrefWithBase } from '../app/site-config.mjs'

function shouldPrefixNativeAnchor(child) {
  const href = child.props.href
  return (
    child.type === 'a' &&
    typeof href === 'string' &&
    href.startsWith('/') &&
    !href.startsWith('//') &&
    hrefWithBase(href) !== href
  )
}

export function withBaseInternalLinks(node, { prefixNativeAnchors = false } = {}) {
  return Children.map(node, (child) => {
    if (!isValidElement(child)) return child

    const nextProps = {}

    if (prefixNativeAnchors && shouldPrefixNativeAnchor(child)) {
      nextProps.href = hrefWithBase(child.props.href)
    }

    if (child.props.children) {
      nextProps.children = withBaseInternalLinks(child.props.children, { prefixNativeAnchors })
    }

    return Object.keys(nextProps).length ? cloneElement(child, nextProps) : child
  })
}
