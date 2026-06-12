import { pathWithBase } from '../app/site-config.mjs'

export function TokenHarmonyFigure() {
  return (
    <figure className="pl-token-harmony">
      <img
        src={pathWithBase('/infographics/holy-trinity.svg')}
        alt="Polaris token harmony: pETH is the collateral, pAssets are the stablecoins, and POLAR is the stewardship token; pETH backs and redeems pAssets, pAssets earn toward stewardship, and pETH burns create POLAR."
        width={1300}
        height={650}
        loading="lazy"
        decoding="async"
      />
    </figure>
  )
}
