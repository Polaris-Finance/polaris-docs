'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Nextra's "Copy page" toolbar renders a headless-ui listbox toggle whose only
// child is a chevron icon, so it ships without an accessible name (fails axe's
// button-name). The theme switch listbox already carries a title, so labelling
// every nameless listbox toggle targets just the copy-page dropdown. Re-runs on
// navigation (the toolbar re-renders per page); no MutationObserver, so it adds
// no main-thread work during hydration.
export function A11yEnhancements() {
  const pathname = usePathname()

  useEffect(() => {
    for (const button of document.querySelectorAll(
      'button[aria-haspopup="listbox"]:not([aria-label]):not([title])'
    )) {
      button.setAttribute('aria-label', 'Copy page options')
    }
  }, [pathname])

  return null
}
