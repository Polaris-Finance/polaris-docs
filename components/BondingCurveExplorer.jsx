'use client'

import { useMemo, useState } from 'react'

// Public Testnet 1 values (Core manifest / DeployPolaris.s.sol)
//   BONDING_CURVE_ALPHA = 193218996973422650  -> 0.19321899697342265
//   BONDING_CURVE_BETA  = 150000000000000000  -> 0.15
// The live curve (ABDKBondingCurve) is p = A * s^B with reserve = A * s^(B+1) / (B+1).
const ALPHA = 0.19321899697342265
const BETA = 0.15

const reserveAt = (supply) => (ALPHA * Math.pow(supply, BETA + 1)) / (BETA + 1)
const priceAt = (supply) => ALPHA * Math.pow(supply, BETA)

export function BondingCurveExplorer() {
  // Supply slider works in log10 space so it can span 1k -> 10M pETH.
  const [supplyExp, setSupplyExp] = useState(5) // 10^5 = 100,000 pETH
  const [tradePct, setTradePct] = useState(5) // trade size as % of supply: + buy, - sell
  const [floorPct, setFloorPct] = useState(50) // floor supply as % of current supply

  const supply = useMemo(() => Math.pow(10, supplyExp), [supplyExp])

  const results = useMemo(() => {
    const price = priceAt(supply)
    const reserve = reserveAt(supply)
    const avgPrice = reserve / supply // = price / (BETA + 1)
    const floorRatio = Math.pow(floorPct / 100, BETA) * 100 // (Qfloor / Q)^beta

    // Trade: buy mints pETH (supply up), sell burns pETH (supply down).
    const tradeFrac = tradePct / 100
    const newSupply = supply * (1 + tradeFrac)
    const newPrice = priceAt(newSupply) // = price * (1 + tradeFrac)^beta
    const priceImpact = (newPrice / price - 1) * 100
    const ethNotional = Math.abs(reserveAt(newSupply) - reserve)

    return {
      price: price.toFixed(3),
      reserve: Math.round(reserve).toLocaleString('en-US'),
      avgPrice: avgPrice.toFixed(3),
      floorRatio: floorRatio.toFixed(1),
      newSupply,
      newPrice,
      priceImpact,
      ethNotional
    }
  }, [supply, tradePct, floorPct])

  const viz = useMemo(() => {
    const width = 600
    const height = 120
    const padding = 10
    const innerWidth = width - 2 * padding
    const innerHeight = height - 2 * padding

    // Window ends at the current supply (the market point sits at the top-right,
    // like the reference infographic) — a buy extends it to the new supply.
    const maxQuantity = Math.max(supply, results.newSupply)
    const maxPrice = priceAt(maxQuantity)

    const toX = (quantity) => padding + (quantity / maxQuantity) * innerWidth
    const toY = (price) => height - padding - (price / maxPrice) * innerHeight

    const curve = []
    for (let index = 0; index <= 60; index += 1) {
      const quantity = (index / 60) * maxQuantity
      curve.push(`${toX(quantity)},${toY(priceAt(quantity))}`)
    }

    const floorSupply = (supply * floorPct) / 100
    return {
      path: `M ${curve.join(' L ')}`,
      leftX: padding,
      baseY: height - padding,
      marketX: toX(supply),
      marketY: toY(priceAt(supply)),
      floorX: toX(floorSupply),
      floorY: toY(priceAt(floorSupply)),
      tradeX: toX(results.newSupply),
      tradeY: toY(results.newPrice)
    }
  }, [supply, floorPct, results.newSupply, results.newPrice])

  const tradeLabel =
    tradePct > 0 ? `Buy ${tradePct}%` : tradePct < 0 ? `Sell ${Math.abs(tradePct)}%` : '—'
  const tradeNote =
    tradePct === 0 ? 'no trade' : `≈ ${Math.round(results.ethNotional).toLocaleString('en-US')} ETH`
  const impactSign = results.priceImpact >= 0 ? '+' : ''

  return (
    <div className="pl-curve-explorer">
      <div className="pl-curve-header">Bonding Curve Explorer</div>

      <div className="pl-curve-controls">
        <div className="pl-curve-field">
          <label htmlFor="bc-supply">pETH supply (Q)</label>
          <input
            id="bc-supply"
            type="range"
            min="3"
            max="7"
            step="0.05"
            value={supplyExp}
            onChange={(event) => setSupplyExp(Number(event.target.value))}
          />
          <span className="pl-curve-value">{Math.round(supply).toLocaleString('en-US')} pETH</span>
        </div>

        <div className="pl-curve-field">
          <label htmlFor="bc-trade">Buy / sell size</label>
          <input
            id="bc-trade"
            type="range"
            min="-20"
            max="20"
            step="0.5"
            value={tradePct}
            onChange={(event) => setTradePct(Number(event.target.value))}
          />
          <span className="pl-curve-value">{tradeLabel}</span>
          <span className="pl-curve-metric-label">{tradeNote}</span>
        </div>

        <div className="pl-curve-field">
          <label htmlFor="bc-floor">Floor at % of supply</label>
          <input
            id="bc-floor"
            type="range"
            min="1"
            max="99"
            step="1"
            value={floorPct}
            onChange={(event) => setFloorPct(Number(event.target.value))}
          />
          <span className="pl-curve-value">{floorPct}%</span>
        </div>

        <div className="pl-curve-field">
          <span className="pl-curve-metric-label">Price impact</span>
          <span className="pl-curve-value">
            {impactSign}
            {results.priceImpact.toFixed(2)}%
          </span>
          <span className="pl-curve-metric-label">→ {results.newPrice.toFixed(3)} ETH spot</span>
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
          <path d={`${viz.path} L 590 ${viz.baseY} L 10 ${viz.baseY} Z`} fill="url(#bc-grad)" />
          <path d={viz.path} fill="none" stroke="#7ba5c9" strokeWidth="2" strokeLinecap="round" />

          {/* floor price guides */}
          <line
            x1={viz.leftX}
            y1={viz.floorY}
            x2={viz.floorX}
            y2={viz.floorY}
            stroke="rgba(123,165,201,0.35)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <line
            x1={viz.floorX}
            y1={viz.floorY}
            x2={viz.floorX}
            y2={viz.baseY}
            stroke="rgba(123,165,201,0.25)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* market price guides */}
          <line
            x1={viz.leftX}
            y1={viz.marketY}
            x2={viz.marketX}
            y2={viz.marketY}
            stroke="rgba(216,201,164,0.4)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <line
            x1={viz.marketX}
            y1={viz.marketY}
            x2={viz.marketX}
            y2={viz.baseY}
            stroke="rgba(216,201,164,0.25)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* trade marker */}
          {tradePct !== 0 && (
            <>
              <line
                x1={viz.marketX}
                y1={viz.marketY}
                x2={viz.tradeX}
                y2={viz.tradeY}
                stroke="rgba(216,201,164,0.6)"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle
                cx={viz.tradeX}
                cy={viz.tradeY}
                r="4"
                fill="none"
                stroke="#d8c9a4"
                strokeWidth="2"
              />
            </>
          )}

          <circle
            cx={viz.floorX}
            cy={viz.floorY}
            r="4"
            fill="#7ba5c9"
            stroke="#0a1628"
            strokeWidth="1.5"
          />
          <circle
            cx={viz.marketX}
            cy={viz.marketY}
            r="5"
            fill="#d8c9a4"
            stroke="#0a1628"
            strokeWidth="2"
          />
        </svg>
      </div>

      <div className="pl-curve-output">
        <div className="pl-curve-metric">
          <span className="pl-curve-metric-label">Spot price</span>
          <span className="pl-curve-metric-value">{results.price} ETH</span>
        </div>
        <div className="pl-curve-metric">
          <span className="pl-curve-metric-label">Reserve backing</span>
          <span className="pl-curve-metric-value">{results.reserve} ETH</span>
        </div>
        <div className="pl-curve-metric">
          <span className="pl-curve-metric-label">Avg price paid</span>
          <span className="pl-curve-metric-value">{results.avgPrice} ETH</span>
        </div>
        <div className="pl-curve-metric">
          <span className="pl-curve-metric-label">Floor ratio</span>
          <span className="pl-curve-metric-value">{results.floorRatio}%</span>
        </div>
      </div>
    </div>
  )
}
