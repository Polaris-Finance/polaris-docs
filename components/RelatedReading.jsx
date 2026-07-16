import { getPageMap } from 'nextra/page-map'
import { pathWithBase } from '../app/site-config.mjs'

function normalizeRoute(route) {
  return route.replace(/\/+$/, '') || '/'
}

function titleOf(item, metaData) {
  const meta = metaData?.[item.name]
  if (typeof meta === 'string') return meta
  if (meta && typeof meta === 'object' && typeof meta.title === 'string') return meta.title
  return item.frontMatter?.sidebarTitle ?? item.frontMatter?.title ?? item.name
}

// Depth-first: the sibling list of a route is the children array of the
// deepest folder that contains it as a leaf page (the root array for
// top-level pages).
function findSiblings(items, route) {
  for (const item of items) {
    if (Array.isArray(item.children)) {
      const found = findSiblings(item.children, route)
      if (found) return found
    }
  }
  const isHere = items.some((item) => !item.children && normalizeRoute(item.route ?? '') === route)
  return isHere ? items : null
}

// Section-mate cards computed from the same page map that drives the sidebar,
// so the list never drifts from the nav and no MDX file is touched. Rendered
// through the theme wrapper's bottomContent slot, after prev/next pagination.
export async function RelatedReading({ path }) {
  const route = normalizeRoute(path)
  const siblings = findSiblings(await getPageMap(), route)
  if (!siblings) return null

  const metaData = siblings.find((item) => item.data)?.data
  const related = siblings
    .filter((item) => !item.children && item.route && normalizeRoute(item.route) !== route)
    .slice(0, 4)
    .map((item) => ({
      route: item.route,
      title: titleOf(item, metaData),
      description: item.frontMatter?.description ?? ''
    }))

  if (!related.length) return null

  return (
    <nav className="pl-related" aria-label="Related reading" data-pagefind-ignore="all">
      <h2 className="pl-related-heading">Related reading</h2>
      <ul className="pl-related-grid">
        {related.map(({ route: itemRoute, title, description }) => (
          <li key={itemRoute}>
            <a className="pl-related-card" href={pathWithBase(itemRoute)}>
              <span className="pl-related-card-title">{title}</span>
              {description ? <span className="pl-related-card-desc">{description}</span> : null}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
