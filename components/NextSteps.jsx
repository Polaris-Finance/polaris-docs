import { pathWithBase } from '../app/site-config.mjs'

export function NextSteps({ steps = [] }) {
  if (!steps.length) return null

  return (
    <section className="pl-next-steps">
      <div className="pl-next-steps-label">Next steps</div>
      <div className="pl-next-steps-grid">
        {steps.map((step) => (
          <a className="pl-next-step-card" href={pathWithBase(step.href)} key={step.href}>
            <span className="pl-next-step-title">{step.title}</span>
            {step.description ? (
              <span className="pl-next-step-desc">{step.description}</span>
            ) : null}
            <span className="pl-next-step-arrow" aria-hidden="true">
              -&gt;
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
