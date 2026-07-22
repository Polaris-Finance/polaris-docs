'use client'

import { ExternalLink, Menu, Search, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { EXTERNAL_LINKS } from '../../app/navigation-config.mjs'
import { PolarisSearch } from '../PolarisSearch'
import { NavThemeSwitch } from '../NavThemeSwitch'
import { MobileDocsNav } from './MobileDocsNav'

const noopSubscribe = () => () => {}
const serverIsMac = () => false
const clientIsMac = () => /Mac|iPhone|iPad/.test(navigator.platform)

function isEditableTarget(element) {
  if (!(element instanceof HTMLElement)) return false
  return Boolean(
    /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName) ||
    element.isContentEditable ||
    element.closest('[contenteditable="true"], [role="textbox"], .monaco-editor')
  )
}

export function NavbarActions() {
  const pathname = usePathname()
  const [surface, setSurface] = useState(null)
  const previousPathname = useRef(pathname)
  const previousSurface = useRef(null)
  const searchTriggerRef = useRef(null)
  const menuTriggerRef = useRef(null)
  const isMac = useSyncExternalStore(noopSubscribe, clientIsMac, serverIsMac)
  const shortcut = isMac ? 'Command+K' : 'Ctrl+K'

  const setSearchOpen = useCallback((open) => setSurface(open ? 'search' : null), [])
  const setMenuOpen = useCallback((open) => setSurface(open ? 'menu' : null), [])

  useEffect(() => {
    if (previousPathname.current === pathname) return
    previousPathname.current = pathname
    setSurface(null)
  }, [pathname])

  useEffect(() => {
    const closedSurface = previousSurface.current
    previousSurface.current = surface
    if (surface !== null || closedSurface === null) return

    const timeout = window.setTimeout(() => {
      if (document.activeElement !== document.body) return
      const fallback =
        closedSurface === 'search' ? searchTriggerRef.current : menuTriggerRef.current
      fallback?.focus({ preventScroll: true })
    }, 400)
    return () => window.clearTimeout(timeout)
  }, [surface])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const closeMobileMenu = () => {
      if (media.matches) setSurface((current) => (current === 'menu' ? null : current))
    }
    closeMobileMenu()
    media.addEventListener('change', closeMobileMenu)
    return () => media.removeEventListener('change', closeMobileMenu)
  }, [])

  useEffect(() => {
    const onGlobalKey = (event) => {
      if (isEditableTarget(document.activeElement)) return
      const commandK = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)
      if (event.key !== '/' && !commandK) return
      event.preventDefault()
      setSurface('search')
    }
    window.addEventListener('keydown', onGlobalKey)
    return () => window.removeEventListener('keydown', onGlobalKey)
  }, [])

  return (
    <div className="pl-navbar-actions">
      <a href={EXTERNAL_LINKS.website} className="pl-nav-website" target="_blank" rel="noreferrer">
        Website
        <ExternalLink aria-hidden="true" size={14} strokeWidth={1.8} />
        <span className="pl-sr-only"> opens in a new tab</span>
      </a>
      <span className="pl-nav-theme">
        <NavThemeSwitch lite />
      </span>
      <button
        ref={searchTriggerRef}
        type="button"
        className="pl-navbar-icon-button"
        aria-label="Search documentation"
        title={`Search (${shortcut})`}
        aria-haspopup="dialog"
        aria-expanded={surface === 'search'}
        onClick={() => setSearchOpen(surface !== 'search')}
      >
        <Search aria-hidden="true" size={19} strokeWidth={1.8} />
      </button>
      <button
        ref={menuTriggerRef}
        type="button"
        className="pl-navbar-icon-button pl-nav-menu-trigger"
        aria-label={surface === 'menu' ? 'Close navigation' : 'Open navigation'}
        aria-haspopup="dialog"
        aria-expanded={surface === 'menu'}
        onClick={() => setMenuOpen(surface !== 'menu')}
      >
        {surface === 'menu' ? (
          <X aria-hidden="true" size={20} strokeWidth={1.8} />
        ) : (
          <Menu aria-hidden="true" size={20} strokeWidth={1.8} />
        )}
      </button>

      <PolarisSearch open={surface === 'search'} onOpenChange={setSearchOpen} />
      <MobileDocsNav
        key={surface === 'menu' ? 'menu-open' : 'menu-closed'}
        open={surface === 'menu'}
        onOpenChange={setMenuOpen}
      />
    </div>
  )
}
