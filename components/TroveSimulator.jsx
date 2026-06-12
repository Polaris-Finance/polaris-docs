'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

export function PositionSimulator({ minCollateralRatio = 1.5 }) {
  const [collateral, setCollateral] = useState(10)
  const [debt, setDebt] = useState(5000)
  const [ethPrice, setEthPrice] = useState(3000)
  const touched = useRef(false)

  // Preconfigured links (?coll=&debt=&price=) reproduce a position, so docs
  // pages and support threads can point at a concrete simulator state.
  useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    const read = (key, set) => {
      const value = Number(search.get(key))
      if (search.has(key) && Number.isFinite(value) && value >= 0) set(value)
    }
    read('coll', setCollateral)
    read('debt', setDebt)
    read('price', setEthPrice)
  }, [])

  useEffect(() => {
    if (!touched.current) return
    const url = new URL(window.location.href)
    url.searchParams.set('coll', String(collateral))
    url.searchParams.set('debt', String(debt))
    url.searchParams.set('price', String(ethPrice))
    window.history.replaceState(null, '', url)
  }, [collateral, debt, ethPrice])

  const setFromInput = (set) => (event) => {
    touched.current = true
    set(Number(event.target.value))
  }

  const results = useMemo(() => {
    const collateralValue = collateral * ethPrice
    const ltv =
      debt === 0 ? 0 : collateralValue > 0 ? debt / collateralValue : Number.POSITIVE_INFINITY
    const maxLtv = 1 / minCollateralRatio
    const warningLtv = 1 / (minCollateralRatio * 1.5)
    const dangerLtv = 1 / (minCollateralRatio * 1.1)
    const liquidationPrice = collateral > 0 ? (debt * minCollateralRatio) / collateral : 0
    let health = 'safe'

    if (ltv > dangerLtv) health = 'danger'
    else if (ltv > warningLtv) health = 'warning'

    return {
      health,
      ltv: Number.isFinite(ltv) ? `${(ltv * 100).toFixed(1)}%` : 'N/A',
      maxLtv: `${(maxLtv * 100).toFixed(1)}%`,
      liquidationPrice: liquidationPrice.toFixed(2)
    }
  }, [collateral, debt, ethPrice, minCollateralRatio])

  return (
    <div className="pl-trove-sim">
      <div className="pl-trove-header">Position Health Simulator</div>

      <div className="pl-trove-grid">
        <div className="pl-trove-field">
          <label htmlFor="ts-collateral">pETH Collateral</label>
          <input
            id="ts-collateral"
            type="number"
            min="0"
            step="0.1"
            value={collateral}
            onChange={setFromInput(setCollateral)}
          />
        </div>

        <div className="pl-trove-field">
          <label htmlFor="ts-debt">Debt (pUSD)</label>
          <input
            id="ts-debt"
            type="number"
            min="0"
            step="100"
            value={debt}
            onChange={setFromInput(setDebt)}
          />
        </div>

        <div className="pl-trove-field">
          <label htmlFor="ts-price">ETH Price (USD)</label>
          <input
            id="ts-price"
            type="number"
            min="1"
            step="100"
            value={ethPrice}
            onChange={setFromInput(setEthPrice)}
          />
        </div>
      </div>

      <div className="pl-trove-results" aria-live="polite">
        <div className="pl-trove-metric">
          <span className="pl-trove-metric-label">LTV</span>
          <span className="pl-trove-metric-value" data-health={results.health}>
            {results.ltv}
          </span>
        </div>
        <div className="pl-trove-metric">
          <span className="pl-trove-metric-label">Liquidation Price</span>
          <span className="pl-trove-metric-value" data-health={results.health}>
            ${results.liquidationPrice}
          </span>
        </div>
        <div className="pl-trove-metric">
          <span className="pl-trove-metric-label">Max LTV</span>
          <span className="pl-trove-metric-value">{results.maxLtv}</span>
        </div>
        <div className="pl-trove-metric">
          <span className="pl-trove-metric-label">Status</span>
          <span className="pl-trove-metric-value" data-health={results.health}>
            {results.health === 'safe'
              ? 'Healthy'
              : results.health === 'warning'
                ? 'Caution'
                : 'At Risk'}
          </span>
        </div>
      </div>
    </div>
  )
}
