import { withBaseInternalLinks } from './internal-links'

const variantTitles = {
  danger: 'Risk',
  info: 'Note',
  success: 'Ready',
  warning: 'Check'
}

function IconGlyph({ variant }) {
  if (variant === 'warning' || variant === 'danger') {
    return (
      <>
        <path
          d="M10 2.5 18 16.5H2L10 2.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M10 7.4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="10" cy="14" r="1" fill="currentColor" />
      </>
    )
  }
  if (variant === 'success') {
    return (
      <>
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M6.5 10.2 9 12.6l4.5-5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    )
  }
  return (
    <>
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 5.8v5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14.2" r="1" fill="currentColor" />
    </>
  )
}

function Icon({ variant }) {
  return (
    <svg className="pl-callout-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <IconGlyph variant={variant} />
    </svg>
  )
}

export function Callout({ variant = 'info', title, children }) {
  return (
    <aside className="pl-callout" data-variant={variant}>
      <Icon variant={variant} />
      <div className="pl-callout-body">
        <div className="pl-callout-title">
          {title ?? variantTitles[variant] ?? variantTitles.info}
        </div>
        <div className="pl-callout-content">
          {withBaseInternalLinks(children, { prefixNativeAnchors: true })}
        </div>
      </div>
    </aside>
  )
}
