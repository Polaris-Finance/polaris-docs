import { pathWithBase } from '../app/site-config.mjs'

const labels = new Map([
  ['using-app', 'Using the App'],
  ['resources', 'Resources'],
  ['peth', 'pETH'],
  ['paths', 'Choose Your Path'],
  ['minting', 'Minting'],
  ['yield', 'Yield'],
  ['polar', 'POLAR'],
  ['stewardship', 'Stewardship']
])

function titleize(segment) {
  return (
    labels.get(segment) ??
    segment.replaceAll('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
  )
}

export function Breadcrumbs({ path }) {
  const segments = path?.split('/').filter(Boolean) ?? []
  if (!segments.length) return null

  return (
    <nav className="pl-breadcrumbs" aria-label="Breadcrumb">
      <ol className="pl-breadcrumb-list">
        <li className="pl-breadcrumb-item">
          <a className="pl-breadcrumb-link" href={pathWithBase('/')}>
            Docs
          </a>
        </li>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`
          const current = index === segments.length - 1

          return (
            <li className="pl-breadcrumb-item" key={href}>
              {current ? (
                <span className="pl-breadcrumb-current" aria-current="page">
                  {titleize(segment)}
                </span>
              ) : (
                <a className="pl-breadcrumb-link" href={pathWithBase(href)}>
                  {titleize(segment)}
                </a>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
