'use client'
import { useEffect } from 'react'

// Nextra's search results panel is portaled to <body> and positioned by
// floating-ui with a fixed 576px width. Now that the search input spans the
// full navbar width, we override left/width to match the input's bounding rect.
//
// Two-stage approach:
//   1. A body childList observer detects when the portaled panel is inserted.
//   2. A targeted style-attribute observer on the panel fires right after
//      floating-ui writes its position, so we can immediately correct it.
//      An equality guard prevents the correction from triggering an infinite loop.
export function SearchPanelFix() {
  useEffect(() => {
    let panelObserver = null

    const align = () => {
      const panel = document.querySelector('.nextra-search-results')
      const inputs = document.querySelectorAll('.nextra-search input')
      const input = Array.from(inputs).find((el) => el.offsetParent !== null) || inputs[0]
      if (!panel || !input) return
      const r = input.getBoundingClientRect()
      const l = Math.round(r.left) + 'px'
      const w = Math.round(r.width) + 'px'
      if (panel.style.left === l && panel.style.width === w) return
      panel.style.left = l
      panel.style.width = w
    }

    const watchPanel = (panel) => {
      panelObserver?.disconnect()
      panelObserver = new MutationObserver(align)
      panelObserver.observe(panel, { attributes: true, attributeFilter: ['style'] })
    }

    // subtree:true so we catch the panel even though it's body > div > div > panel
    const bodyObserver = new MutationObserver(() => {
      const panel = document.querySelector('.nextra-search-results')
      if (panel) {
        align()
        watchPanel(panel)
      }
    })
    bodyObserver.observe(document.body, { childList: true, subtree: true })

    window.addEventListener('resize', align)
    return () => {
      bodyObserver.disconnect()
      panelObserver?.disconnect()
      window.removeEventListener('resize', align)
    }
  }, [])

  return null
}
