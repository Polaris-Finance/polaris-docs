'use client'

import { Menu, Search, X } from 'lucide-react'
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
  const mobileSearchTriggerRef = useRef(null)
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
        closedSurface === 'search'
          ? window.matchMedia('(min-width: 768px)').matches
            ? searchTriggerRef.current
            : mobileSearchTriggerRef.current
          : menuTriggerRef.current
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
      <button
        ref={searchTriggerRef}
        type="button"
        className="pl-navbar-search-trigger"
        aria-label="Search documentation"
        title={`Search (${shortcut})`}
        aria-haspopup="dialog"
        aria-expanded={surface === 'search'}
        onClick={() => setSearchOpen(surface !== 'search')}
      >
        <svg
          className="pl-navbar-search-glyph"
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.579 11.816a6 6 0 1 1 1.238-1.238l3.427 3.428a.875.875 0 1 1-1.238 1.238l-3.427-3.428ZM11.25 7a4.25 4.25 0 1 1-8.5 0 4.25 4.25 0 0 1 8.5 0Z"
          />
        </svg>
        <span className="pl-navbar-search-label">Search</span>
        <kbd aria-hidden="true">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
      </button>

      <div className="pl-navbar-end">
        <span className="pl-nav-theme">
          <NavThemeSwitch lite />
        </span>
        <a
          href={EXTERNAL_LINKS.testnetApp}
          className="pl-nav-testnet"
          target="_blank"
          rel="noreferrer"
        >
          Try Testnet
          <span className="pl-sr-only"> opens in a new tab</span>
        </a>
        <button
          ref={mobileSearchTriggerRef}
          type="button"
          className="pl-navbar-icon-button pl-navbar-search-icon-button"
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
      </div>

      <PolarisSearch open={surface === 'search'} onOpenChange={setSearchOpen} />
      <MobileDocsNav
        key={surface === 'menu' ? 'menu-open' : 'menu-closed'}
        open={surface === 'menu'}
        onOpenChange={setMenuOpen}
      />
    </div>
  )
}
