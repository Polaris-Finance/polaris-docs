'use client'

import { useMemo, useState } from 'react'

export function BondingCurveExplorer() {
  const [ethDeposited, setEthDeposited] = useState(10)
  const [alpha, setAlpha] = useState(1)
  const [beta, setBeta] = useState(0.5)

  const results = useMemo(() => {
    const quantity = ethDeposited
    const price = alpha * Math.pow(quantity, beta)
    const floor = alpha * Math.pow(quantity * 0.5, beta)
    const pethReceived = quantity / price
    const ratio = (floor / price) * 100

    return {
      price: price.toFixed(4),
      floor: floor.toFixed(4),
      pethReceived: pethReceived.toFixed(4),
      ratio: ratio.toFixed(1)
    }
  }, [ethDeposited, alpha, beta])

  const svgPath = useMemo(() => {
    const width = 600
    const height = 120
    const padding = 10
    const maxQuantity = 100
    const maxPrice = alpha * Math.pow(maxQuantity, beta)
    const points = []

    for (let index = 0; index <= 50; index += 1) {
      const quantity = (index / 50) * maxQuantity
      const price = alpha * Math.pow(quantity, beta)
      const x = padding + (quantity / maxQuantity) * (width - 2 * padding)
      const y = height - padding - (price / maxPrice) * (height - 2 * padding)
      points.push(`${x},${y}`)
    }

    return `M ${points.join(' L ')}`
  }, [alpha, beta])

  const currentX = useMemo(() => {
    const width = 600
    const padding = 10
    return padding + (ethDeposited / 100) * (width - 2 * padding)
  }, [ethDeposited])

  const currentY = useMemo(() => {
    const height = 120
    const padding = 10
    const maxPrice = alpha * Math.pow(100, beta)
    const price = alpha * Math.pow(ethDeposited, beta)
    return height - padding - (price / maxPrice) * (height - 2 * padding)
  }, [ethDeposited, alpha, beta])

  return (
    <div className="pl-curve-explorer">
      <div className="pl-curve-header">Bonding Curve Explorer</div>

      <div className="pl-curve-controls">
        <div className="pl-curve-field">
          <label htmlFor="bc-eth">ETH Deposited</label>
          <input
            id="bc-eth"
            type="range"
            min="1"
            max="100"
            step="1"
            value={ethDeposited}
            onChange={(event) => setEthDeposited(Number(event.target.value))}
          />
          <span className="pl-curve-value">{ethDeposited} ETH</span>
        </div>

        <div className="pl-curve-field">
          <label htmlFor="bc-alpha">Curve Parameter alpha</label>
          <input
            id="bc-alpha"
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={alpha}
            onChange={(event) => setAlpha(Number(event.target.value))}
          />
          <span className="pl-curve-value">{alpha.toFixed(1)}</span>
        </div>

        <div className="pl-curve-field">
          <label htmlFor="bc-beta">Curve Parameter beta</label>
          <input
            id="bc-beta"
            type="range"
            min="0.1"
            max="1.5"
            step="0.05"
            value={beta}
            onChange={(event) => setBeta(Number(event.target.value))}
          />
          <span className="pl-curve-value">{beta.toFixed(2)}</span>
        </div>
      </div>

      <div className="pl-curve-viz" aria-hidden="true">
        <svg viewBox="0 0 600 120" preserveAspectRatio="none">
          <defs>
            <linearGradient id="bc-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7ba5c9" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#7ba5c9" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <line
              key={`h-${tick}`}
              x1={10}
              y1={10 + tick * 100}
              x2={590}
              y2={10 + tick * 100}
              stroke="rgba(123,165,201,0.1)"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
          ))}
          <path d={`${svgPath} L 590 110 L 10 110 Z`} fill="url(#bc-grad)" />
          <path d={svgPath} fill="none" stroke="#7ba5c9" strokeWidth="2" strokeLinecap="round" />
          <circle
            cx={currentX}
            cy={currentY}
            r="5"
            fill="#d8c9a4"
            stroke="#0a1628"
            strokeWidth="2"
          />
          <line
            x1={currentX}
            y1={currentY}
            x2={currentX}
            y2={110}
            stroke="rgba(216,201,164,0.3)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        </svg>
      </div>

      <div className="pl-curve-output">
        <div className="pl-curve-metric">
          <span className="pl-curve-metric-label">pETH Price</span>
          <span className="pl-curve-metric-value">{results.price} ETH</span>
        </div>
        <div className="pl-curve-metric">
          <span className="pl-curve-metric-label">Floor Price</span>
          <span className="pl-curve-metric-value">{results.floor} ETH</span>
        </div>
        <div className="pl-curve-metric">
          <span className="pl-curve-metric-label">pETH Received</span>
          <span className="pl-curve-metric-value">{results.pethReceived}</span>
        </div>
        <div className="pl-curve-metric">
          <span className="pl-curve-metric-label">Floor Ratio</span>
          <span className="pl-curve-metric-value">{results.ratio}%</span>
        </div>
      </div>
    </div>
  )
}
