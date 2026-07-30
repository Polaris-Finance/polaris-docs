import { createElement } from 'react'
import { GLYPH_SHAPES } from './glyph-shapes.mjs'

/* Renders one entry of GLYPH_SHAPES. Nodes are [tag, attributes, ...children],
   so a glyph can group parts that the hover animations move together. */

function renderNode([tag, attributes, ...children], key) {
  return createElement(
    tag,
    { key, ...attributes },
    children.length ? children.map(renderNode) : undefined
  )
}

export function Glyph({ className = '', name, size = 24, strokeWidth = 1.8 }) {
  const shape = GLYPH_SHAPES[name] ?? GLYPH_SHAPES.FileText

  return createElement(
    'svg',
    {
      'aria-hidden': 'true',
      className: ['pl-glyph', className].filter(Boolean).join(' '),
      fill: 'none',
      focusable: 'false',
      height: size,
      stroke: 'currentColor',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth,
      viewBox: '0 0 24 24',
      width: size,
      xmlns: 'http://www.w3.org/2000/svg'
    },
    shape.map(renderNode)
  )
}
