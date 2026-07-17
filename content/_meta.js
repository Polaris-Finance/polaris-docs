export default {
  // Site-wide page chrome: no visible breadcrumbs, no "On this page" panel
  // (owner decision, July 2026). JSON-LD breadcrumbs are unaffected.
  '*': {
    theme: {
      breadcrumb: false,
      toc: false
    }
  },
  index: 'Introduction',
  overview: 'Overview',
  'core-assets': 'Core Assets',
  architecture: 'Core Architecture',
  design: 'Protocol Mechanics',
  testnet: 'Using Polaris Testnet',
  risks: 'Risks'
}
