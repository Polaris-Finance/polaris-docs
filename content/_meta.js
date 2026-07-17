export default {
  // Site-wide page chrome: no visible breadcrumbs, no "On this page" panel
  // (owner decision, July 2026). JSON-LD breadcrumbs are unaffected.
  '*': {
    theme: {
      breadcrumb: false,
      toc: false
    }
  },
  '-- home': {
    type: 'separator',
    title: 'Home'
  },
  index: 'Introduction',
  manifesto: 'Manifesto',
  'why-peth': 'Why pETH',
  vision: 'Vision',
  'core-assets': 'Core Assets',
  architecture: 'Protocol Architecture',
  design: 'Protocol Design',
  testnet: 'Using Polaris Testnet',
  risks: 'Risks'
}
