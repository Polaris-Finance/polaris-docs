import { pathWithBase } from '../app/site-config.mjs'

const explainers = [
  {
    href: '/explainers/2-min',
    minutes: '2',
    title: 'Overview',
    description: 'What Polaris is, in one sitting.',
    fillClass: 'pl-depth-f1',
    markClass: 'pl-depth-m1'
  },
  {
    href: '/explainers/5-min',
    minutes: '5',
    title: 'Presentation',
    description: 'Three engines and the flywheel.',
    fillClass: 'pl-depth-f2',
    markClass: 'pl-depth-m2'
  },
  {
    href: '/explainers/10-min',
    minutes: '10',
    title: 'Full Introduction',
    description: 'The complete system from first principles.',
    fillClass: 'pl-depth-f3',
    markClass: 'pl-depth-m3',
    emphasized: true
  }
]

export function TimedExplainers() {
  return (
    <div className="pl-depth-grid">
      {explainers.map((explainer) => (
        <a
          key={explainer.href}
          href={pathWithBase(explainer.href)}
          className={`pl-depth-card${explainer.emphasized ? ' pl-depth-deep' : ''}`}
        >
          <div className="pl-depth-head">
            <span className="pl-depth-time">
              <span className="pl-depth-num">{explainer.minutes}</span>
              <span className="pl-depth-unit">min</span>
            </span>
            <span className="pl-depth-meter" aria-hidden="true">
              <span className="pl-depth-track" />
              <span className={`pl-depth-fill ${explainer.fillClass}`} />
              <span className={`pl-depth-mark ${explainer.markClass}`} />
            </span>
          </div>
          <span className="pl-depth-title">{explainer.title}</span>
          <span className="pl-depth-desc">{explainer.description}</span>
          <span className="pl-depth-foot" aria-hidden="true">
            <span className="pl-depth-go">
              Read <span className="pl-depth-arrow">&rarr;</span>
            </span>
          </span>
        </a>
      ))}
    </div>
  )
}
