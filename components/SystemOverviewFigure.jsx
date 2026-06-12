import { pathWithBase } from '../app/site-config.mjs'

const DEFAULT_CAPTION =
  'ETH enters the system, pETH becomes collateral, and protocol activity drives yield back through the system.'

export function SystemOverviewFigure({ caption = DEFAULT_CAPTION }) {
  return (
    <figure className="pl-system-overview">
      <img
        className="pl-system-overview__horizontal"
        src={pathWithBase('/polaris-system-v2.svg')}
        alt="Polaris system overview: ETH swaps into pETH on the bonding curve, pETH collateralizes pAsset branches that mint pUSD, and burning pETH for POLAR raises the floor and releases ETH"
        width={1200}
        height={540}
        loading="lazy"
        decoding="async"
      />
      <img
        className="pl-system-overview__vertical"
        src={pathWithBase('/polaris-system-v2-vertical.svg')}
        alt="Polaris system overview: ETH swaps into pETH on the bonding curve, pETH collateralizes pAsset branches that mint pUSD, and burning pETH for POLAR raises the floor and releases ETH"
        width={400}
        height={1450}
        loading="lazy"
        decoding="async"
      />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}
