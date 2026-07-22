'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

function isOutsideScrollport(element, scrollport) {
  const item = element.getBoundingClientRect()
  const rail = scrollport.getBoundingClientRect()
  return item.top < rail.top || item.bottom > rail.bottom
}

export function A11yEnhancements() {
  const pathname = usePathname()
  const previousPathname = useRef(pathname)

  useEffect(() => {
    let frame = 0

    const labelLandmarks = () => {
      document.querySelector('header nav')?.setAttribute('aria-label', 'Primary')
      const sidebar = document.querySelector('.nextra-sidebar')
      if (sidebar) {
        sidebar.setAttribute('role', 'navigation')
        sidebar.setAttribute('aria-label', 'Documentation')
      }
    }

    const labelCopyPageOptions = () => {
      for (const button of document.querySelectorAll(
        'button[aria-haspopup="listbox"]:not([aria-label]):not([title])'
      )) {
        if (button.parentElement?.textContent?.includes('Copy page')) {
          button.setAttribute('aria-label', 'Copy page options')
        }
      }
    }

    const syncSidebarState = () => {
      const sidebar = document.querySelector('.nextra-sidebar')
      if (!sidebar) return

      const links = sidebar.querySelectorAll('a[href]')
      for (const link of links) link.removeAttribute('aria-current')

      const activeLink = sidebar.querySelector('li.active > a[href]')
      if (activeLink) {
        activeLink.setAttribute('aria-current', 'page')
        const scrollport = activeLink.closest('ul[class*="overflow-y-auto"]') ?? sidebar
        if (isOutsideScrollport(activeLink, scrollport)) {
          activeLink.scrollIntoView({ block: 'nearest' })
        }
      }

      const folders = sidebar.querySelectorAll('button[data-href]')
      folders.forEach((button, index) => {
        const list = button.nextElementSibling?.querySelector('ul')
        if (!list) return
        const controlsId = list.id || `pl-sidebar-folder-${index}`
        list.id = controlsId
        button.setAttribute('aria-controls', controlsId)
        const expanded = button.parentElement?.classList.contains('open') ? 'true' : 'false'
        if (button.getAttribute('aria-expanded') !== expanded) {
          button.setAttribute('aria-expanded', expanded)
        }
      })
    }

    const applyEnhancements = () => {
      labelLandmarks()
      labelCopyPageOptions()
      syncSidebarState()
    }

    const skipLink = document.querySelector('.nextra-skip-nav')
    const focusMain = () => {
      window.requestAnimationFrame(() => {
        const main = document.querySelector('main')
        if (!main) return
        if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1')
        main.focus({ preventScroll: false })
      })
    }

    const scheduleEnhancements = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        applyEnhancements()
      })
    }

    applyEnhancements()
    skipLink?.addEventListener('click', focusMain)
    const observer = new MutationObserver(scheduleEnhancements)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-headlessui-state', 'aria-expanded'],
      childList: true,
      subtree: true
    })

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      skipLink?.removeEventListener('click', focusMain)
      observer.disconnect()
    }
  }, [pathname])

  useEffect(() => {
    if (previousPathname.current === pathname) return
    previousPathname.current = pathname
    // Dialog libraries restore trigger focus after their leave transition.
    // Move focus after that restoration so overlay navigation lands on content.
    const timeout = window.setTimeout(() => {
      let hashTarget = null
      if (window.location.hash) {
        try {
          hashTarget = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
        } catch {
          hashTarget = document.getElementById(window.location.hash.slice(1))
        }
      }
      const destination =
        hashTarget ??
        document.querySelector('article h1, main h1') ??
        document.querySelector('main')
      if (!destination) return
      if (!destination.hasAttribute('tabindex')) destination.setAttribute('tabindex', '-1')
      destination.focus({ preventScroll: false })
      if (hashTarget) hashTarget.scrollIntoView({ block: 'start' })
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [pathname])

  return null
}
