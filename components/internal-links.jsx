import { Children, cloneElement, isValidElement } from 'react'
import { pathWithBase } from '../app/site-config.mjs'

function shouldPrefixHref(href) {
  return (
    typeof href === 'string' &&
    href.startsWith('/') &&
    !href.startsWith('//') &&
    !href.startsWith(pathWithBase('/'))
  )
}

export function withBaseInternalLinks(node) {
  return Children.map(node, (child) => {
    if (!isValidElement(child)) return child

    const nextProps = {}

    if (shouldPrefixHref(child.props.href)) {
      nextProps.href = pathWithBase(child.props.href)
    }

    if (child.props.children) {
      nextProps.children = withBaseInternalLinks(child.props.children)
    }

    return Object.keys(nextProps).length ? cloneElement(child, nextProps) : child
  })
}
