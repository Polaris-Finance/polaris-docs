'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

function expandActiveSidebarTrail(sidebar, activeLink) {
  // Search closes its dialog during navigation. Wait for the dialog cleanup to
  // remove `inert`; synthetic clicks are intentionally suppressed inside an
  // inert subtree.
  if (sidebar.closest('[inert]')) return

  const closedFolders = []
  let ancestor = activeLink.parentElement

  while (ancestor && ancestor !== sidebar) {
    if (ancestor.matches('li:not(.open)')) {
      const button = ancestor.querySelector(':scope > button[data-href]')
      if (button) closedFolders.unshift(button)
    }
    ancestor = ancestor.parentElement
  }

  for (const button of closedFolders) button.click()
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
        expandActiveSidebarTrail(sidebar, activeLink)
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
