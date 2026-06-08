import { pathWithBase } from '../app/site-config.mjs'

export function Stepper({ steps = [], activeIndex = 0 }) {
  if (!steps.length) return null

  return (
    <nav className="pl-stepper" aria-label="Progress">
      {steps.map((step, i) => (
        <span key={i} className="pl-stepper-step-wrapper">
          {i > 0 && (
            <span className="pl-stepper-sep" aria-hidden="true">
              →
            </span>
          )}
          <a
            href={pathWithBase(step.href)}
            className="pl-stepper-step"
            data-active={i === activeIndex}
            aria-current={i === activeIndex ? 'step' : undefined}
          >
            <span className="pl-stepper-num">{i + 1}</span>
            <span>{step.label}</span>
          </a>
        </span>
      ))}
    </nav>
  )
}
