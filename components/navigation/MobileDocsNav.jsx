'use client'

import { DialogTitle } from '@headlessui/react'
import { ArrowLeft, ChevronRight, Search, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BASE_PATH, pathWithBase } from '../../app/site-config.mjs'
import {
  findNodeById,
  findTrailByRoute,
  NAVIGATION_GROUPS,
  normalizeRoute,
  routeBelongsToNode,
  toneForNodeId
} from '../../app/navigation-config.mjs'
import { PolarisFooter } from '../PolarisFooter'
import { DocsOverlay } from './DocsOverlay'
import { NavIcon } from './NavIcon.js'

function routeFromPathname(pathname) {
  const withoutBase =
    BASE_PATH && pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) : pathname
  return normalizeRoute(withoutBase || '/')
}

function focusDocumentHeading() {
  window.setTimeout(() => {
    const heading = document.querySelector('article h1, main h1') ?? document.querySelector('main')
    if (!heading) return
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
    heading.focus({ preventScroll: false })
  }, 500)
}

export function MobileDocsNav({ open, onOpenChange, onSearchRequest }) {
  const pathname = usePathname()
  const router = useRouter()
  const route = routeFromPathname(pathname)
  const [stack, setStack] = useState([])
  const firstItemRef = useRef(null)
  const currentItemRef = useRef(null)
  const previousPathname = useRef(pathname)

  const currentNode = stack.length ? findNodeById(stack.at(-1)) : null
  const backDestination =
    stack.length === 1 ? 'Documentation' : (findNodeById(stack.at(-2))?.label ?? 'Documentation')
  const items = (currentNode?.children ?? NAVIGATION_GROUPS).filter(
    (node) => node.display !== 'hidden'
  )
  const parentTone = currentNode ? toneForNodeId(currentNode.id) : 'gold'
  const currentTrail = useMemo(() => findTrailByRoute(route), [route])
  const currentIds = useMemo(() => new Set(currentTrail.map((node) => node.id)), [currentTrail])

  useEffect(() => {
    if (previousPathname.current === pathname) return
    previousPathname.current = pathname
    onOpenChange(false)
  }, [onOpenChange, pathname])

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => {
      const target = currentItemRef.current ?? firstItemRef.current
      target?.focus({ preventScroll: true })
      target?.scrollIntoView({ block: 'nearest' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [open, stack])

  const drillInto = (node) => {
    setStack((current) => [...current, node.id])
  }

  const goBack = () => {
    setStack((current) => current.slice(0, -1))
  }

  const close = () => {
    setStack([])
    onOpenChange(false)
  }

  const navigate = (event, destination) => {
    event.preventDefault()
    close()
    if (destination === route) {
      focusDocumentHeading()
      return
    }
    router.push(destination)
  }

  return (
    <DocsOverlay kind="menu" open={open} onClose={close} initialFocus={currentItemRef}>
      <button
        type="button"
        className="pl-overlay-icon-button pl-overlay-navbar-control pl-overlay-navbar-control--before-end"
        aria-label="Search documentation"
        aria-haspopup="dialog"
        onClick={onSearchRequest}
      >
        <Search aria-hidden="true" size={19} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        className="pl-overlay-icon-button pl-overlay-navbar-control pl-overlay-navbar-control--end"
        aria-label="Close navigation"
        onClick={close}
      >
        <X aria-hidden="true" size={20} strokeWidth={1.8} />
      </button>
      <div className="pl-mobile-nav-shell">
        <header className="pl-mobile-nav-header">
          {stack.length ? (
            <button
              type="button"
              className="pl-overlay-icon-button"
              aria-label={`Back to ${backDestination}`}
              onClick={goBack}
            >
              <ArrowLeft aria-hidden="true" size={19} strokeWidth={1.8} />
            </button>
          ) : (
            <span className="pl-mobile-nav-header-spacer" aria-hidden="true" />
          )}
          <DialogTitle className="pl-mobile-nav-title">
            {currentNode?.label ?? 'Documentation'}
          </DialogTitle>
          <span className="pl-mobile-nav-header-spacer" aria-hidden="true" />
        </header>

        <nav className="pl-mobile-nav-body" aria-label="Mobile documentation">
          <ul className="pl-mobile-nav-list">
            {items.map((node, index) => {
              const isBranch = node.type !== 'page'
              const isCurrentBranch = isBranch
                ? currentIds.has(node.id) || routeBelongsToNode(route, node)
                : node.route === route
              const leadingIcon =
                node.type === 'group' ? null : (
                  <NavIcon icon={node.icon} tone={node.tone ?? parentTone} />
                )

              return (
                <li key={node.id}>
                  {isBranch ? (
                    <button
                      ref={
                        isCurrentBranch ? currentItemRef : index === 0 ? firstItemRef : undefined
                      }
                      type="button"
                      className="pl-mobile-nav-row"
                      data-current-branch={isCurrentBranch ? 'true' : undefined}
                      onClick={() => drillInto(node)}
                    >
                      <span className="pl-mobile-nav-row-main">
                        {leadingIcon}
                        <span className="pl-mobile-nav-row-label">{node.label}</span>
                      </span>
                      <span className="pl-mobile-nav-row-tail">
                        {isCurrentBranch ? (
                          <span className="pl-mobile-nav-current">Current section</span>
                        ) : null}
                        <ChevronRight aria-hidden="true" size={17} strokeWidth={1.8} />
                      </span>
                    </button>
                  ) : (
                    <a
                      ref={
                        isCurrentBranch ? currentItemRef : index === 0 ? firstItemRef : undefined
                      }
                      href={pathWithBase(node.route)}
                      className="pl-mobile-nav-row"
                      aria-current={node.route === route ? 'page' : undefined}
                      onClick={(event) => navigate(event, node.route)}
                    >
                      <span className="pl-mobile-nav-row-main">
                        {leadingIcon}
                        <span className="pl-mobile-nav-row-label">{node.label}</span>
                      </span>
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        <PolarisFooter className="pl-mobile-nav-footer" />
      </div>
    </DocsOverlay>
  )
}
