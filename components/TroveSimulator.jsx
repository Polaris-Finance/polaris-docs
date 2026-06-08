'use client'

import { useMemo, useState } from 'react'

export function TroveSimulator({ minCollateralRatio = 1.5 }) {
  const [collateral, setCollateral] = useState(10)
  const [debt, setDebt] = useState(5000)
  const [ethPrice, setEthPrice] = useState(3000)

  const results = useMemo(() => {
    const collateralValue = collateral * ethPrice
    const icr = debt > 0 ? collateralValue / debt : Number.POSITIVE_INFINITY
    const liquidationPrice = collateral > 0 ? (debt * minCollateralRatio) / collateral : 0
    const maxDebt = collateralValue / minCollateralRatio
    let health = 'safe'

    if (icr < minCollateralRatio * 1.1) health = 'danger'
    else if (icr < minCollateralRatio * 1.5) health = 'warning'

    return {
      health,
      icr: Number.isFinite(icr) ? icr.toFixed(2) : 'N/A',
      liquidationPrice: liquidationPrice.toFixed(2),
      maxDebt: maxDebt.toFixed(2)
    }
  }, [collateral, debt, ethPrice, minCollateralRatio])

  return (
    <div className="pl-trove-sim">
      <div className="pl-trove-header">Trove Health Simulator</div>

      <div className="pl-trove-grid">
        <div className="pl-trove-field">
          <label htmlFor="ts-collateral">pETH Collateral</label>
          <input
            id="ts-collateral"
            type="number"
            min="0"
            step="0.1"
            value={collateral}
            onChange={(event) => setCollateral(Number(event.target.value))}
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
            onChange={(event) => setDebt(Number(event.target.value))}
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
            onChange={(event) => setEthPrice(Number(event.target.value))}
          />
        </div>
      </div>

      <div className="pl-trove-results">
        <div className="pl-trove-metric">
          <span className="pl-trove-metric-label">Collateral Ratio</span>
          <span className="pl-trove-metric-value" data-health={results.health}>
            {results.icr}x
          </span>
        </div>
        <div className="pl-trove-metric">
          <span className="pl-trove-metric-label">Liquidation Price</span>
          <span className="pl-trove-metric-value" data-health={results.health}>
            ${results.liquidationPrice}
          </span>
        </div>
        <div className="pl-trove-metric">
          <span className="pl-trove-metric-label">Max Safe Debt</span>
          <span className="pl-trove-metric-value">${results.maxDebt}</span>
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
