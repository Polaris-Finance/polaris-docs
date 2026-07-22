export const EXTERNAL_LINKS = Object.freeze({
  website: 'https://polarisfinance.io',
  github: 'https://github.com/Polaris-Finance',
  x: 'https://x.com/polarisfinance_'
})

export const NAVIGATION_GROUPS = [
  {
    id: 'introduction',
    type: 'group',
    label: 'Introduction',
    children: [
      {
        id: 'docs-home',
        type: 'page',
        metaKey: 'index',
        label: 'Polaris Documentation',
        route: '/',
        icon: 'FileText',
        display: 'hidden',
        theme: { copyPage: false, pagination: false },
        kind: 'concept'
      },
      page('polaris-101', 'polaris-101', 'Polaris 101', '/polaris-101', 'BookOpen'),
      {
        id: 'overview',
        type: 'folder',
        metaKey: 'overview',
        label: 'Overview',
        routePrefix: '/overview',
        icon: 'Compass',
        children: [
          page('manifesto', 'manifesto', 'Manifesto', '/overview/manifesto', 'ScrollText'),
          page('why-peth', 'why-peth', 'Why pETH', '/overview/why-peth', 'Gem'),
          page('vision', 'vision', 'Vision', '/overview/vision', 'Telescope')
        ]
      }
    ]
  },
  {
    id: 'protocol',
    type: 'group',
    label: 'Protocol',
    children: [
      {
        id: 'core-assets',
        type: 'folder',
        metaKey: 'core-assets',
        label: 'Core Assets',
        routePrefix: '/core-assets',
        icon: 'Coins',
        children: [
          page('peth', 'peth', 'pETH', '/core-assets/peth', 'Hexagon'),
          page('usdp', 'usdp', 'USDp', '/core-assets/usdp', 'CircleDollarSign'),
          page('goldp', 'goldp', 'GOLDp', '/core-assets/goldp', 'Coins'),
          page('polar', 'polar', 'POLAR', '/core-assets/polar', 'Orbit'),
          page('fpeth', 'fpeth', 'fpETH', '/core-assets/fpeth', 'Layers3'),
          page('vpeth-asset', 'vpeth', 'vpETH', '/core-assets/vpeth', 'Vote')
        ]
      },
      {
        id: 'architecture',
        type: 'folder',
        metaKey: 'architecture',
        label: 'Core Architecture',
        routePrefix: '/architecture',
        icon: 'Network',
        children: [
          page(
            'bonding-curve',
            'bonding-curve',
            'Bonding Curve',
            '/architecture/bonding-curve',
            'ChartLine'
          ),
          page(
            'passet-markets',
            'passet-markets',
            'pAsset Markets',
            '/architecture/passet-markets',
            'Landmark'
          ),
          page('earn-vaults', 'earn-vaults', 'Earn Vaults', '/architecture/earn-vaults', 'Vault'),
          page(
            'reserve-loans',
            'reserve-loans',
            'Reserve Loans',
            '/architecture/reserve-loans',
            'HandCoins'
          ),
          page('stewardship', 'stewardship', 'Stewardship', '/architecture/stewardship', 'Scale'),
          page('flows', 'flows', 'Flows', '/architecture/flows', 'Workflow'),
          page('tokenomics', 'tokenomics', 'Tokenomics', '/architecture/tokenomics', 'ChartPie')
        ]
      },
      {
        id: 'design',
        type: 'folder',
        metaKey: 'design',
        label: 'Protocol Mechanics',
        routePrefix: '/design',
        icon: 'Cog',
        children: [
          page('fee-router', 'fee-router', 'Fee Router', '/design/fee-router', 'Route'),
          page(
            'revenue-model',
            'revenue-model',
            'Revenue Model',
            '/design/revenue-model',
            'BadgeDollarSign'
          ),
          page(
            'adaptive-peg-defence',
            'adaptive-peg-defence',
            'Adaptive Peg Defence',
            '/design/adaptive-peg-defence',
            'ShieldCheck'
          ),
          page(
            'spike-and-decay-fees',
            'spike-and-decay-fees',
            'Spike-and-Decay Fees',
            '/design/spike-and-decay-fees',
            'Activity'
          ),
          page(
            'interest-rates',
            'interest-rates',
            'Interest Rates',
            '/design/interest-rates',
            'Percent'
          ),
          page(
            'recovery-mode',
            'recovery-mode',
            'Recovery Mode',
            '/design/recovery-mode',
            'LifeBuoy'
          ),
          page('conversions', 'conversions', 'Conversions', '/design/conversions', 'RefreshCw'),
          page('liquidations', 'liquidations', 'Liquidations', '/design/liquidations', 'Gavel'),
          page('oracles', 'oracles', 'Oracles', '/design/oracles', 'RadioTower')
        ]
      }
    ]
  },
  {
    id: 'use-polaris',
    type: 'group',
    label: 'Use Polaris',
    children: [
      {
        id: 'testnet',
        type: 'folder',
        metaKey: 'testnet',
        label: 'Using the Testnet',
        routePrefix: '/testnet',
        icon: 'FlaskConical',
        children: [
          page(
            'dashboard',
            'dashboard',
            'Dashboard',
            '/testnet/dashboard',
            'LayoutDashboard',
            'app'
          ),
          page('guide', 'guide', 'Guide', '/testnet/guide', 'Map', 'app'),
          page('swap', 'swap', 'Swap', '/testnet/swap', 'ArrowLeftRight', 'app'),
          page('mint', 'mint', 'Mint', '/testnet/mint', 'Stamp', 'app'),
          page(
            'reserve-loan',
            'reserve-loan',
            'Reserve Loan',
            '/testnet/reserve-loan',
            'HandCoins',
            'app'
          ),
          page('earn', 'earn', 'Earn', '/testnet/earn', 'TrendingUp', 'app'),
          page('split', 'split', 'Split', '/testnet/split', 'Split', 'app'),
          page('vepolar', 'vepolar', 'vePOLAR', '/testnet/vepolar', 'Vote', 'app'),
          page('liquidity', 'liquidity', 'Liquidity', '/testnet/liquidity', 'Waves', 'app'),
          page('vpeth-testnet', 'vpeth', 'vpETH', '/testnet/vpeth', 'BadgeCheck', 'app'),
          page('advanced', 'advanced', 'Advanced', '/testnet/advanced', 'SlidersHorizontal', 'app'),
          page('analytics', 'analytics', 'Analytics', '/testnet/analytics', 'ChartColumn', 'app')
        ]
      }
    ]
  },
  {
    id: 'reference',
    type: 'group',
    label: 'Reference',
    children: [
      {
        id: 'risks',
        type: 'folder',
        metaKey: 'risks',
        label: 'Risks',
        routePrefix: '/risks',
        icon: 'ShieldAlert',
        children: [
          page('risks-overview', 'index', 'Overview', '/risks', 'TriangleAlert', 'reference'),
          page(
            'security-properties',
            'security-properties',
            'Security Guarantees',
            '/risks/security-properties',
            'ShieldCheck',
            'reference'
          )
        ]
      }
    ]
  }
]

export const FOOTER_LINKS = [
  { type: 'external', label: 'Website', href: EXTERNAL_LINKS.website },
  { type: 'artifact', label: 'llms.txt', href: '/llms.txt' }
]

function page(id, metaKey, label, route, icon, kind = 'concept') {
  return { id, type: 'page', metaKey, label, route, icon, kind }
}

function walk(nodes, visit, ancestors = []) {
  for (const node of nodes) {
    if (visit(node, ancestors) === false) return false
    if (node.children && walk(node.children, visit, [...ancestors, node]) === false) return false
  }
  return true
}

export function allNavigationNodes() {
  const nodes = []
  walk(NAVIGATION_GROUPS, (node) => nodes.push(node))
  return nodes
}

export function allPageNodes() {
  return allNavigationNodes().filter((node) => node.type === 'page')
}

export function allVisiblePageNodes() {
  return allPageNodes().filter((node) => node.display !== 'hidden')
}

export function findNodeById(id) {
  return allNavigationNodes().find((node) => node.id === id) ?? null
}

export function findPageByRoute(route) {
  const normalized = normalizeRoute(route)
  return allPageNodes().find((node) => node.route === normalized) ?? null
}

export function findTrailByRoute(route) {
  const normalized = normalizeRoute(route)
  let result = []
  walk(NAVIGATION_GROUPS, (node, ancestors) => {
    if (node.type === 'page' && node.route === normalized) {
      result = [...ancestors, node]
      return false
    }
    return true
  })
  return result
}

export function navigationSectionForRoute(route) {
  const trail = findTrailByRoute(route)
  const folder = [...trail].reverse().find((node) => node.type === 'folder')
  return folder?.label ?? trail.find((node) => node.type === 'group')?.label ?? 'Introduction'
}

export function navigationKindForRoute(route) {
  return findPageByRoute(route)?.kind ?? 'concept'
}

export function metaEntriesForDirectory(directory = '/') {
  const normalized = normalizeRoute(directory)
  if (normalized === '/') {
    return NAVIGATION_GROUPS.flatMap((group) => [
      { type: 'separator', metaKey: `---${group.id}`, label: group.label },
      ...group.children
    ])
  }

  const folder = allNavigationNodes().find(
    (node) => node.type === 'folder' && node.routePrefix === normalized
  )
  return folder?.children ?? []
}

export function routeBelongsToNode(route, node) {
  const normalized = normalizeRoute(route)
  if (node.type === 'page') return node.route === normalized
  let belongs = false
  walk(node.children ?? [], (child) => {
    if (child.type === 'page' && child.route === normalized) {
      belongs = true
      return false
    }
    return true
  })
  return belongs
}

export function normalizeRoute(route = '/') {
  const path = route.split('#')[0].split('?')[0]
  if (!path || path === '/') return '/'
  return `/${path.replace(/^\/+|\/+$/g, '')}`
}
