'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Nextra's "Copy page" toolbar renders a headless-ui listbox toggle whose only
// child is a chevron icon, so it ships without an accessible name (fails axe's
// button-name). The control can render after the route effect, so we watch for
// late toolbar insertion and label only the nameless toggle beside "Copy page".
export function A11yEnhancements() {
  const pathname = usePathname()

  useEffect(() => {
    const labelCopyPageOptions = () => {
      for (const button of document.querySelectorAll(
        'button[aria-haspopup="listbox"]:not([aria-label]):not([title])'
      )) {
        if (button.parentElement?.textContent?.includes('Copy page')) {
          button.setAttribute('aria-label', 'Copy page options')
        }
      }
    }

    const syncMobileNavInertState = () => {
      const nav = document.querySelector('.nextra-mobile-nav')
      if (!nav) return

      const rect = nav.getBoundingClientRect()
      const style = window.getComputedStyle(nav)
      const isClosed =
        style.display === 'none' || style.visibility === 'hidden' || rect.bottom <= 1

      if (nav.inert !== isClosed) nav.inert = isClosed
      if (nav.hasAttribute('inert') !== isClosed) nav.toggleAttribute('inert', isClosed)
      if (isClosed) {
        if (nav.getAttribute('aria-hidden') !== 'true') nav.setAttribute('aria-hidden', 'true')
      } else if (nav.hasAttribute('aria-hidden')) {
        nav.removeAttribute('aria-hidden')
      }
    }

    const applyEnhancements = () => {
      labelCopyPageOptions()
      syncMobileNavInertState()
    }

    applyEnhancements()
    const observer = new MutationObserver(applyEnhancements)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-headlessui-state', 'aria-expanded'],
      childList: true,
      subtree: true
    })

    window.addEventListener('resize', applyEnhancements)
    window.addEventListener('transitionend', applyEnhancements, true)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', applyEnhancements)
      window.removeEventListener('transitionend', applyEnhancements, true)
    }
  }, [pathname])

  return null
}
