import { pathWithBase } from '../app/site-config.mjs'

const phases = [
  {
    name: 'Early Research',
    date: '2024',
    labelPos: 'above',
    style: 'spark',
    desc: 'Initial exploration of bonding curve mechanics and counterparty-free stablecoin design.',
    link: null
  },
  {
    name: 'Team Formation',
    date: 'June 2025',
    labelPos: 'below',
    style: 'spark',
    desc: 'Core team assembled around the Polaris protocol vision.',
    link: null
  },
  {
    name: 'Private Testnet 1',
    date: 'Private · March 2026',
    labelPos: 'above',
    style: 'spark',
    desc: 'Closed testnet for internal validation and security review.',
    link: '/resources/testnet'
  },
  {
    name: 'Public Testnet 1',
    date: 'Public · May 2026',
    labelPos: 'below',
    style: 'polaris',
    isNow: true,
    desc: 'Public testnet on Sepolia. Open for community testing and feedback.',
    link: '/resources/testnet'
  },
  {
    name: 'Mainnet',
    date: 'Forthcoming',
    labelPos: 'above',
    style: 'distant',
    desc: 'Production deployment on Ethereum mainnet.',
    link: '/launch-status'
  }
]

function Tooltip({ title, desc }) {
  return (
    <div className="pl-tooltip">
      <div className="pl-tooltip-title">{title}</div>
      <div>{desc}</div>
    </div>
  )
}

export function LaunchTimeline() {
  return (
    <figure className="pl-voyage" aria-labelledby="launch-timeline-caption">
      <div
        className="pl-chart"
        role="img"
        aria-label="Polaris launch timeline. Early Research in 2024. Team Formation in June 2025. Private Testnet 1, March 2026. Public Testnet 1, May 2026, the current phase. Mainnet, forthcoming."
      >
        <svg className="pl-route" viewBox="0 0 1000 168" preserveAspectRatio="none">
          <defs>
            <linearGradient id="pl-grad-l" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2c4a6e" />
              <stop offset="52%" stopColor="#b1934f" />
              <stop offset="100%" stopColor="#3f7fa8" />
            </linearGradient>
            <linearGradient id="pl-grad-d" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#214a72" />
              <stop offset="52%" stopColor="#d8c9a4" />
              <stop offset="100%" stopColor="#7ba5c9" />
            </linearGradient>
          </defs>
          <path
            className="pl-route-glow"
            pathLength="100"
            vectorEffect="non-scaling-stroke"
            d="M100 84 L700 84"
          />
          <path
            className="pl-route-line"
            pathLength="100"
            vectorEffect="non-scaling-stroke"
            d="M100 84 L700 84"
          />
          <path className="pl-route-ahead" vectorEffect="non-scaling-stroke" d="M700 84 L886 84" />
        </svg>

        {phases.map((phase, i) => {
          const nodeClass = `pl-node pl-n${i + 1}`
          const starClass = `pl-star pl-s${i + 1}`
          const labelClass = `pl-label pl-${phase.labelPos}${phase.isNow ? ' pl-now' : ''}${phase.style === 'distant' ? ' pl-faint' : ''}`

          return (
            <div key={i} className={nodeClass}>
              <span className={starClass}>
                {phase.style === 'spark' && <span className="pl-spark" />}
                {phase.style === 'polaris' && (
                  <span className="pl-polaris">
                    <span className="pl-halo" />
                    <span className="pl-flare-h" />
                    <span className="pl-flare-v" />
                    <span className="pl-polaris-star" />
                    <span className="pl-polaris-core" />
                  </span>
                )}
                {phase.style === 'distant' && (
                  <span className="pl-distant">
                    <span className="pl-distant-ring" />
                    <span className="pl-distant-star" />
                  </span>
                )}
              </span>
              <span className={labelClass}>
                <span className="pl-tooltip-wrap">
                  <span className="pl-name">
                    {phase.name}
                    {phase.isNow && <span className="pl-badge">NOW</span>}
                  </span>
                  <Tooltip title={phase.name} desc={phase.desc} link={phase.link} />
                </span>
                <span className="pl-date">{phase.date}</span>
              </span>
            </div>
          )
        })}
      </div>
      <figcaption id="launch-timeline-caption" className="pl-timeline-caption">
        Polaris is currently in Public Testnet 1 on Sepolia; mainnet remains forthcoming.
      </figcaption>
      <ol className="pl-timeline-list">
        {phases.map((phase) => (
          <li key={phase.name} aria-current={phase.isNow ? 'step' : undefined}>
            {phase.link ? (
              <a href={pathWithBase(phase.link)}>{phase.name}</a>
            ) : (
              <span>{phase.name}</span>
            )}
            <span>{phase.date}</span>
            <p>{phase.desc}</p>
          </li>
        ))}
      </ol>
    </figure>
  )
}
