export function AddressBlock({ address, network = 'Sepolia', explorerUrl }) {
  if (!address) return null

  return (
    <div className="pl-address-block">
      <span className="pl-address-network">{network}</span>
      <code className="pl-address-code">{address}</code>
      <button
        type="button"
        className="pl-address-copy"
        onClick={() => navigator.clipboard?.writeText(address)}
      >
        Copy
      </button>
      {explorerUrl ? (
        <a
          className="pl-address-explorer"
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Explorer
        </a>
      ) : null}
    </div>
  )
}
