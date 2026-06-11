// Single source of truth for the current launch phase. Components, generated
// LLM artifacts, and the content lint (scripts/check-content.mjs) all read from
// here, so advancing the phase is a one-file edit plus a lint-guided review of
// any prose still naming the old phase.

export const TIMELINE_PHASES = [
  {
    name: 'Early Research',
    date: '2024',
    labelPos: 'above',
    style: 'spark',
    desc: 'Initial exploration of bonding curve mechanics and counterparty-free stablecoin design.',
    link: null
  },
  {
    name: 'Team Formation',
    date: 'June 2025',
    labelPos: 'below',
    style: 'spark',
    desc: 'Core team assembled around the Polaris protocol vision.',
    link: null
  },
  {
    name: 'Private Testnet 1',
    date: 'Private · March 2026',
    labelPos: 'above',
    style: 'spark',
    desc: 'Closed testnet for internal validation and security review.',
    link: '/resources/testnet'
  },
  {
    name: 'Public Testnet 1',
    date: 'Public · May 2026',
    labelPos: 'below',
    style: 'polaris',
    isNow: true,
    desc: 'Public testnet on Sepolia. Open for community testing and feedback.',
    link: '/resources/testnet'
  },
  {
    name: 'Mainnet',
    date: 'Forthcoming',
    labelPos: 'above',
    style: 'distant',
    desc: 'Production deployment on Ethereum mainnet.',
    link: '/launch-status'
  }
]

export const LAUNCH_PHASE = TIMELINE_PHASES.find((phase) => phase.isNow).name
export const LAUNCH_NETWORK = 'Sepolia'
export const LAUNCH_CHAIN_ID = 11155111
export const LAUNCH_EXPLORER_URL = 'https://sepolia.etherscan.io'
export const OFFICIAL_TESTNET_APP_URL = 'https://app.testnet.polarisfinance.io/'

function plainDate(phase) {
  return phase.date.replace(/^[^·]*·\s*/, '')
}

export function timelineSummary() {
  const steps = TIMELINE_PHASES.map(
    (phase) => `${phase.name}, ${plainDate(phase)}${phase.isNow ? ', the current phase' : ''}`
  )
  return `Polaris launch timeline. ${steps.join('. ')}.`
}

export function timelineCaption() {
  return `Polaris is currently in ${LAUNCH_PHASE} on ${LAUNCH_NETWORK}; mainnet remains forthcoming.`
}
