export function DetailAccordion({ items = [] }) {
  if (!items.length) return null

  return (
    <div className="pl-accordion">
      {items.map((item) => (
        <details className="pl-accordion-item" key={item.title}>
          <summary className="pl-accordion-summary">
            <span>{item.title}</span>
            <span className="pl-accordion-chevron" aria-hidden="true">
              v
            </span>
          </summary>
          <div className="pl-accordion-content">{item.content}</div>
        </details>
      ))}
    </div>
  )
}
