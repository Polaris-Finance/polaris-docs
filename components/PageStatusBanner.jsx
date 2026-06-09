import { pathWithBase } from '../app/site-config.mjs'

export function PageStatusBanner({ lastUpdated, network = 'Sepolia', phase = 'Public Testnet 1' }) {
  return (
    // Indexed-page chrome: keep it out of Pagefind so it never becomes a result
    // excerpt (it otherwise leads every page's snippet with testnet/status text).
    <aside className="pl-status-banner" data-pagefind-ignore>
      <span className="pl-status-pill">
        <span className="pl-status-dot" aria-hidden="true" />
        {phase}
      </span>
      <span className="pl-status-network">{network}</span>
      {lastUpdated ? (
        <>
          <span className="pl-status-sep" aria-hidden="true">
            /
          </span>
          <span className="pl-status-date">Last verified {lastUpdated}</span>
        </>
      ) : null}
      <a className="pl-status-link" href={pathWithBase('/launch-status')}>
        Launch status
      </a>
    </aside>
  )
}
