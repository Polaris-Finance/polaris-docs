import { withBaseInternalLinks } from './internal-links'

export function DetailAccordion({ items = [] }) {
  if (!items.length) return null

  const slugForItem = (item) =>
    (item.id ?? item.title ?? item.question ?? '')
      .toString()
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  return (
    <div className="pl-accordion">
      {items.map((item) => (
        <details
          className="pl-accordion-item"
          id={slugForItem(item) || undefined}
          key={item.title ?? item.question}
        >
          <summary className="pl-accordion-summary">
            <span>{item.title ?? item.question}</span>
            <span className="pl-accordion-chevron" aria-hidden="true">
              {'>'}
            </span>
          </summary>
          <div className="pl-accordion-content">
            {withBaseInternalLinks(item.content ?? item.answer)}
          </div>
        </details>
      ))}
    </div>
  )
}
