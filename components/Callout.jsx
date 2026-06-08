import { withBaseInternalLinks } from './internal-links'

const variantTitles = {
  danger: 'Risk',
  info: 'Note',
  success: 'Ready',
  warning: 'Check'
}

function Icon() {
  return (
    <svg className="pl-callout-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 5.8v5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14.2" r="1" fill="currentColor" />
    </svg>
  )
}

export function Callout({ variant = 'info', title, children }) {
  return (
    <aside className="pl-callout" data-variant={variant}>
      <Icon />
      <div className="pl-callout-body">
        <div className="pl-callout-title">
          {title ?? variantTitles[variant] ?? variantTitles.info}
        </div>
        <div className="pl-callout-content">{withBaseInternalLinks(children)}</div>
      </div>
    </aside>
  )
}
