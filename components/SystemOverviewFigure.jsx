import { pathWithBase } from '../app/site-config.mjs'

export function SystemOverviewFigure() {
  return (
    <figure className="pl-system-overview">
      <img
        src={pathWithBase('/polaris-system-v2.svg')}
        alt="Polaris system overview: ETH swaps into pETH on the bonding curve, pETH collateralizes CDPs that mint pUSD, and burning pETH for POLAR raises the floor and releases ETH"
        width={1200}
        height={540}
        loading="lazy"
        decoding="async"
      />
      <figcaption>
        Polaris has one collateral primitive, pETH, one CDP factory for pAssets, and one conversion
        path that burns pETH to mint POLAR while raising the floor.
      </figcaption>
    </figure>
  )
}
