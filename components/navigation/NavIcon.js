import { createElement } from 'react'
import { pathWithBase } from '../../app/site-config.mjs'
import {
  Activity,
  ArrowLeftRight,
  BadgeCheck,
  BadgeDollarSign,
  BookOpen,
  ChartColumn,
  ChartLine,
  ChartPie,
  CircleDollarSign,
  Cog,
  Coins,
  Compass,
  FileText,
  FlaskConical,
  Gavel,
  Gem,
  HandCoins,
  Hexagon,
  Landmark,
  Layers3,
  LayoutDashboard,
  LifeBuoy,
  Map as MapIcon,
  Network,
  Orbit,
  Percent,
  RadioTower,
  RefreshCw,
  Route as RouteIcon,
  Scale,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Split as SplitIcon,
  Stamp,
  Telescope,
  TrendingUp,
  TriangleAlert,
  Vault,
  Vote,
  Waves,
  Workflow
} from 'lucide-react'

export const NAV_ICON_REGISTRY = Object.freeze({
  Activity,
  ArrowLeftRight,
  BadgeCheck,
  BadgeDollarSign,
  BookOpen,
  ChartColumn,
  ChartLine,
  ChartPie,
  CircleDollarSign,
  Cog,
  Coins,
  Compass,
  FileText,
  FlaskConical,
  Gavel,
  Gem,
  HandCoins,
  Hexagon,
  Landmark,
  Layers3,
  LayoutDashboard,
  LifeBuoy,
  Map: MapIcon,
  Network,
  Orbit,
  Percent,
  RadioTower,
  RefreshCw,
  Route: RouteIcon,
  Scale,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Split: SplitIcon,
  Stamp,
  Telescope,
  TrendingUp,
  TriangleAlert,
  Vault,
  Vote,
  Waves,
  Workflow
})

export const ASSET_ICONS = Object.freeze({
  'asset:peth': '/asset-icons/peth.png',
  'asset:usdp': '/asset-icons/usdp.png',
  'asset:goldp': '/asset-icons/goldp.png',
  'asset:polar': '/asset-icons/polar.png',
  'asset:fpeth': '/asset-icons/fpeth.png',
  'asset:vpeth': '/asset-icons/vpeth.png'
})

export function hasNavIcon(icon) {
  return Boolean(icon && (NAV_ICON_REGISTRY[icon] || ASSET_ICONS[icon]))
}

export function NavIcon({ icon, className = '', size = 16, strokeWidth = 1.8 }) {
  if (ASSET_ICONS[icon]) {
    return createElement('img', {
      'aria-hidden': 'true',
      alt: '',
      className: ['pl-nav-icon', 'pl-nav-icon-asset', className].filter(Boolean).join(' '),
      height: size,
      src: pathWithBase(ASSET_ICONS[icon]),
      width: size
    })
  }

  const Icon = NAV_ICON_REGISTRY[icon] ?? FileText
  return createElement(Icon, {
    'aria-hidden': 'true',
    className: ['pl-nav-icon', className].filter(Boolean).join(' '),
    focusable: 'false',
    size,
    strokeWidth
  })
}
