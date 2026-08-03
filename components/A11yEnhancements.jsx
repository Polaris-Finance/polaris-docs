'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef } from 'react'

const SIDEBAR_SCROLL_STORAGE_KEY = 'polaris-docs:sidebar-scroll-top'

function getSidebarScrollport() {
  return document.querySelector('.nextra-sidebar > .nextra-scrollbar.nextra-mask')
}

function readSidebarScrollTop() {
  try {
    const stored = window.sessionStorage.getItem(SIDEBAR_SCROLL_STORAGE_KEY)
    if (stored === null) return null
    const value = Number(stored)
    return Number.isFinite(value) && value >= 0 ? value : null
  } catch {
    return null
  }
}

function writeSidebarScrollTop(value) {
  try {
    window.sessionStorage.setItem(SIDEBAR_SCROLL_STORAGE_KEY, String(value))
  } catch {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }
}

export function A11yEnhancements() {
  const pathname = usePathname()
  const previousPathname = useRef(pathname)
  const restoringSidebarScroll = useRef(false)

  useLayoutEffect(() => {
    const scrollport = getSidebarScrollport()
    const savedScrollTop = readSidebarScrollTop()
    if (!scrollport || savedScrollTop === null) return

    restoringSidebarScroll.current = true
    const restore = () => {
      const maximumScrollTop = Math.max(0, scrollport.scrollHeight - scrollport.clientHeight)
      scrollport.scrollTop = Math.min(savedScrollTop, maximumScrollTop)
    }

    restore()
    let secondFrame = 0
    const firstFrame = window.requestAnimationFrame(() => {
      restore()
      secondFrame = window.requestAnimationFrame(() => {
        restore()
        restoringSidebarScroll.current = false
      })
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      if (secondFrame) window.cancelAnimationFrame(secondFrame)
      restoringSidebarScroll.current = false
    }
  }, [pathname])

  useEffect(() => {
    const scrollport = getSidebarScrollport()
    if (!scrollport) return

    const saveScrollTop = () => {
      if (!restoringSidebarScroll.current) writeSidebarScrollTop(scrollport.scrollTop)
    }

    scrollport.addEventListener('scroll', saveScrollTop, { passive: true })
    scrollport.addEventListener('click', saveScrollTop, true)
    return () => {
      scrollport.removeEventListener('scroll', saveScrollTop)
      scrollport.removeEventListener('click', saveScrollTop, true)
    }
  }, [pathname])

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

    const alignCopyPageWithTitle = () => {
      const article = document.querySelector('article')
      const main = article?.querySelector(':scope > main')
      if (!article || !main || main.querySelector('.pl-docs-home')) return
      if (main.querySelector(':scope > .pl-article-heading-row')) return

      const copyControl = article.querySelector(':scope > div[class*="x:float-end"]')
      const heading = main.querySelector(':scope > h1:first-of-type')
      if (!copyControl || !heading) return

      const row = document.createElement('div')
      row.className = 'pl-article-heading-row'
      copyControl.classList.add('pl-copy-page-control')
      main.insertBefore(row, heading)
      row.append(heading, copyControl)
    }

    const syncSidebarState = () => {
      const sidebar = document.querySelector('.nextra-sidebar')
      if (!sidebar) return

      const links = sidebar.querySelectorAll('a[href]')
      for (const link of links) link.removeAttribute('aria-current')

      const activeLink = sidebar.querySelector('li.active > a[href]')
      if (activeLink) {
        activeLink.setAttribute('aria-current', 'page')
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
      alignCopyPageWithTitle()
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
      attributeFilter: [
        'class',
        'style',
        'data-headlessui-state',
        'aria-expanded',
        'aria-hidden',
        'inert'
      ],
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
      destination.focus({ preventScroll: true })
      if (hashTarget) hashTarget.scrollIntoView({ block: 'start' })
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [pathname])

  return null
}
