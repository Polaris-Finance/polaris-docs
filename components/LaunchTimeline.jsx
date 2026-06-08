export function LaunchTimeline() {
  return (
    <div
      className="pl-voyage"
      role="img"
      aria-label="Polaris launch timeline. Early Research in 2024. Team Formation in June 2025. Testnet 1, private, March 2026. Testnet 2, public, May 2026, the current phase. Mainnet, forthcoming."
    >
      <div className="pl-chart" aria-hidden="true">
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

        <div className="pl-node pl-n1">
          <span className="pl-star pl-s1">
            <span className="pl-spark" />
          </span>
          <span className="pl-label pl-above">
            <span className="pl-name">Early Research</span>
            <span className="pl-date">2024</span>
          </span>
        </div>

        <div className="pl-node pl-n2">
          <span className="pl-star pl-s2">
            <span className="pl-spark" />
          </span>
          <span className="pl-label pl-below">
            <span className="pl-name">Team Formation</span>
            <span className="pl-date">June 2025</span>
          </span>
        </div>

        <div className="pl-node pl-n3">
          <span className="pl-star pl-s3">
            <span className="pl-spark" />
          </span>
          <span className="pl-label pl-above">
            <span className="pl-name">Testnet 1</span>
            <span className="pl-date">Private · March 2026</span>
          </span>
        </div>

        <div className="pl-node pl-n4">
          <span className="pl-star pl-s4">
            <span className="pl-polaris">
              <span className="pl-halo" />
              <span className="pl-flare-h" />
              <span className="pl-flare-v" />
              <span className="pl-polaris-star" />
              <span className="pl-polaris-core" />
            </span>
          </span>
          <span className="pl-label pl-below pl-now">
            <span className="pl-name">
              Testnet 2<span className="pl-badge">NOW</span>
            </span>
            <span className="pl-date">Public · May 2026</span>
          </span>
        </div>

        <div className="pl-node pl-n5">
          <span className="pl-star pl-s5">
            <span className="pl-distant">
              <span className="pl-distant-ring" />
              <span className="pl-distant-star" />
            </span>
          </span>
          <span className="pl-label pl-above pl-faint">
            <span className="pl-name">Mainnet</span>
            <span className="pl-date">Forthcoming</span>
          </span>
        </div>
      </div>
    </div>
  )
}
