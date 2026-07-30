import { createElement } from 'react'
import { pathWithBase } from '../../app/site-config.mjs'
import { Glyph } from '../icons/Glyph.js'
import { GLYPH_SHAPES } from '../icons/glyph-shapes.mjs'

export const NAV_ICON_REGISTRY = GLYPH_SHAPES

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

export function NavIcon({ icon, className = '', size = 18, strokeWidth = 1.8, tone }) {
  const toneClass = tone ? `pl-icon-tone-${tone}` : ''

  if (ASSET_ICONS[icon]) {
    return createElement('img', {
      'aria-hidden': 'true',
      alt: '',
      className: ['pl-nav-icon', 'pl-nav-icon-asset', className].filter(Boolean).join(' '),
      decoding: 'async',
      height: size,
      loading: 'lazy',
      src: pathWithBase(ASSET_ICONS[icon]),
      width: size
    })
  }

  return createElement(Glyph, {
    className: ['pl-nav-icon', toneClass, className].filter(Boolean).join(' '),
    name: icon,
    size,
    strokeWidth
  })
}
