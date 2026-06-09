'use client'

import { useCallback, useDeferredValue, useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { hrefWithBase, pathWithBase } from '../app/site-config.mjs'

// A Polaris-branded replacement for Nextra's stock Pagefind search. Same engine
// and data, richer result display: each hit carries its section and a type
// marker, results group by page, the panel keeps an initial "Start here" state,
// a recovering empty state, section filter chips, and a keyboard legend. On
// mobile it opens as a full-screen sheet rather than a cramped dropdown.

const PLACEHOLDER = 'Search the docs…'
const MAX_PAGES = 8
const MAX_SUBRESULTS = 5
const SEARCH_OPTIONS = { excerptLength: 18 }
const RECENT_KEY = 'polaris-docs:recent-searches'
const MAX_RECENT = 5

// Curated entry points for the queryless state, in the protocol's reading order.
const START_HERE = [
  { title: 'Public Testnet Quickstart', url: '/quickstart', section: 'Get started', kind: 'guide' },
  { title: 'Why Polaris', url: '/why-polaris', section: 'Understand Polaris', kind: 'concept' },
  { title: 'Core Concepts', url: '/core-concepts', section: 'Understand Polaris', kind: 'concept' },
  {
    title: 'Open a Trove',
    url: '/minting/open-a-trove',
    section: 'Minting & Troves',
    kind: 'concept'
  }
]

// Recovery links for a no-results query.
const RECOVERY = [
  { title: 'FAQ', url: '/resources/faq', section: 'Resources', kind: 'reference' },
  { title: 'Troubleshooting', url: '/troubleshooting', section: 'Get started', kind: 'guide' },
  {
    title: 'Browse the full docs (llms.txt)',
    url: '/llms.txt',
    section: 'Plain text',
    kind: 'reference'
  }
]

let pagefindPromise = null
function loadPagefind() {
  if (!pagefindPromise) {
    pagefindPromise = (async () => {
      const pf = await import(/* webpackIgnore: true */ pathWithBase('/_pagefind/pagefind.js'))
      await pf.options({ baseUrl: '/' })
      return pf
    })()
  }
  return pagefindPromise
}

function cleanUrl(url) {
  return url.replace(/\.html$/, '').replace(/\.html#/, '#')
}

function readRecent() {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter((q) => typeof q === 'string').slice(0, MAX_RECENT)
      : []
  } catch {
    return []
  }
}

function writeRecent(query) {
  try {
    const next = [query, ...readRecent().filter((q) => q !== query)].slice(0, MAX_RECENT)
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable; recent searches are best-effort */
  }
}

export function PolarisSearch() {
  const router = useRouter()
  const id = useId()
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | ready | empty | error
  const [error, setError] = useState('')
  const [pages, setPages] = useState([])
  const [facets, setFacets] = useState([]) // [{ value, count }]
  const [section, setSection] = useState(null) // active section filter
  const [active, setActive] = useState(-1) // keyboard cursor into `items`
  const [recent, setRecent] = useState([])

  useEffect(() => {
    setMounted(true)
    setRecent(readRecent())
  }, [])

  // Run the Pagefind query whenever the (deferred) text or the active facet changes.
  useEffect(() => {
    const term = deferredQuery.trim()
    if (!term) {
      setStatus('idle')
      setPages([])
      setFacets([])
      setError('')
      return
    }

    let cancelled = false
    setStatus('loading')
    ;(async () => {
      let pf
      try {
        pf = await loadPagefind()
      } catch (err) {
        if (cancelled) return
        setError(
          'Search runs against the built site. In local dev, run `npm run build` once, then restart `npm run dev`.'
        )
        setStatus('error')
        return
      }

      const options = section
        ? { ...SEARCH_OPTIONS, filters: { section: [section] } }
        : SEARCH_OPTIONS
      const response = await pf.debouncedSearch(term, options)
      if (cancelled || !response) return // superseded by a newer keystroke

      const data = await Promise.all(response.results.slice(0, MAX_PAGES).map((r) => r.data()))
      if (cancelled) return

      const nextPages = data.map((page) => ({
        url: cleanUrl(page.url),
        title: page.meta?.title ?? 'Untitled',
        section: page.meta?.section ?? '',
        kind: page.meta?.kind ?? 'concept',
        subResults: (page.sub_results ?? []).slice(0, MAX_SUBRESULTS).map((sub) => ({
          url: cleanUrl(sub.url),
          title: sub.title,
          excerpt: sub.excerpt
        }))
      }))

      const sectionFacet = response.totalFilters?.section ?? response.filters?.section ?? {}
      const nextFacets = Object.entries(sectionFacet)
        .filter(([, count]) => count > 0)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)

      setPages(nextPages)
      setFacets(nextFacets)
      setActive(-1)
      setStatus(nextPages.length ? 'ready' : 'empty')
    })()

    return () => {
      cancelled = true
    }
  }, [deferredQuery, section])

  // Flat list of keyboard-navigable links for the current view.
  const items =
    status === 'ready'
      ? pages.flatMap((page) => page.subResults.map((sub) => ({ url: sub.url, query: null })))
      : status === 'idle'
        ? [
            ...recent.map((q) => ({ url: null, query: q })),
            ...START_HERE.map((s) => ({ url: s.url, query: null }))
          ]
        : status === 'empty'
          ? RECOVERY.map((r) => ({ url: r.url, query: null }))
          : []

  const close = useCallback(() => {
    setOpen(false)
    setActive(-1)
  }, [])

  const go = useCallback(
    (url) => {
      const [pathOnly, hash] = url.split('#')
      const based = hrefWithBase(pathOnly)
      const here = location.pathname.replace(/\/$/, '') === based.replace(/\/$/, '')
      const committed = query.trim()
      if (committed) {
        writeRecent(committed)
        setRecent(readRecent())
      }
      setQuery('')
      close()
      inputRef.current?.blur()
      if (here && hash) {
        location.hash = hash
      } else if (here) {
        // same page, no anchor: nothing to navigate
      } else {
        router.push(url)
      }
    },
    [close, query, router]
  )

  const onItem = useCallback(
    (item) => {
      if (item.query != null) {
        setQuery(item.query)
        inputRef.current?.focus()
      } else if (item.url) {
        go(item.url)
      }
    },
    [go]
  )

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      if (query) {
        setQuery('')
      } else {
        close()
        inputRef.current?.blur()
      }
      return
    }
    if (event.key === 'ArrowDown' && items.length) {
      event.preventDefault()
      setOpen(true)
      setActive((i) => (i + 1) % items.length)
    } else if (event.key === 'ArrowUp' && items.length) {
      event.preventDefault()
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1))
    } else if (event.key === 'Enter' && active >= 0 && items[active]) {
      event.preventDefault()
      onItem(items[active])
    }
  }

  // Keep the active row in view as the cursor moves.
  useEffect(() => {
    if (active < 0 || !listRef.current) return
    const el = listRef.current.querySelector(`#${CSS.escape(`${id}-i-${active}`)}`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active, id])

  // Close on outside pointer / route away.
  useEffect(() => {
    if (!open) return
    const onPointer = (event) => {
      if (!containerRef.current?.contains(event.target)) close()
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open, close])

  // Global "/" and ⌘K / Ctrl-K focus the search.
  useEffect(() => {
    const onGlobalKey = (event) => {
      const el = document.activeElement
      const typing = el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)
      if (typing) return
      const isSlash = event.key === '/'
      const isK =
        event.key === 'k' && (navigator.userAgent.includes('Mac') ? event.metaKey : event.ctrlKey)
      if (isSlash || isK) {
        event.preventDefault()
        inputRef.current?.focus({ preventScroll: true })
      }
    }
    window.addEventListener('keydown', onGlobalKey)
    return () => window.removeEventListener('keydown', onGlobalKey)
  }, [])

  const toggleSection = (value) => {
    setSection((current) => (current === value ? null : value))
  }

  const isMac = mounted && navigator.userAgent.includes('Mac')
  const resultCount = pages.reduce((n, p) => n + p.subResults.length, 0)
  const showPanel = open
  const activeId = active >= 0 ? `${id}-i-${active}` : undefined

  // Stable per-item index so rows can claim the right keyboard id.
  let cursor = -1
  const nextId = () => {
    cursor += 1
    return { idx: cursor, domId: `${id}-i-${cursor}` }
  }

  return (
    <div ref={containerRef} className="nextra-search pl-search">
      <div className="pl-search-field">
        <SearchIcon />
        <input
          ref={inputRef}
          type="search"
          spellCheck={false}
          autoComplete="off"
          className="pl-search-input"
          placeholder={PLACEHOLDER}
          value={query}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={`${id}-listbox`}
          aria-activedescendant={activeId}
          aria-label="Search the documentation"
          onChange={(e) => {
            setQuery(e.target.value)
            setSection(null)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {mounted && (
          <kbd className="pl-search-kbd" aria-hidden="true">
            {isMac ? <span className="pl-search-cmd">⌘</span> : 'Ctrl '}K
          </kbd>
        )}
      </div>

      {showPanel && (
        <div
          className="nextra-search-results pl-search-results"
          // Keep input focus when clicking inside the panel; rows handle nav.
          onMouseDown={(e) => e.preventDefault()}
        >
          {facets.length > 1 && status !== 'idle' && (
            <div className="pl-search-facets" role="group" aria-label="Filter by section">
              <button
                type="button"
                className="pl-search-chip"
                aria-pressed={section === null}
                onClick={() => setSection(null)}
              >
                All
              </button>
              {facets.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className="pl-search-chip"
                  aria-pressed={section === f.value}
                  onClick={() => toggleSection(f.value)}
                >
                  {f.value} <span className="pl-search-chip-count">{f.count}</span>
                </button>
              ))}
            </div>
          )}

          <div
            ref={listRef}
            id={`${id}-listbox`}
            role="listbox"
            aria-label="Search results"
            className="pl-search-list"
          >
            {status === 'error' && (
              <div className="pl-search-message" role="status">
                <InfoIcon />
                <p>{error}</p>
              </div>
            )}

            {status === 'loading' && (
              <div className="pl-search-message" role="status">
                <SpinnerIcon />
                <span>Searching…</span>
              </div>
            )}

            {status === 'idle' && (
              <>
                {recent.length > 0 && (
                  <Group label="Recent">
                    {recent.map((q) => {
                      const { idx, domId } = nextId()
                      return (
                        <RecentRow
                          key={q}
                          id={domId}
                          query={q}
                          active={active === idx}
                          onActivate={() => onItem({ query: q })}
                          onHover={() => setActive(idx)}
                        />
                      )
                    })}
                  </Group>
                )}
                <Group label="Start here">
                  {START_HERE.map((s) => {
                    const { idx, domId } = nextId()
                    return (
                      <LinkRow
                        key={s.url}
                        id={domId}
                        href={hrefWithBase(s.url)}
                        title={s.title}
                        section={s.section}
                        kind={s.kind}
                        active={active === idx}
                        onActivate={() => onItem({ url: s.url })}
                        onHover={() => setActive(idx)}
                      />
                    )
                  })}
                </Group>
              </>
            )}

            {status === 'ready' &&
              pages.map((page) => (
                <div key={page.url} className="pl-search-group" role="presentation">
                  <div className="pl-search-group-head">
                    <span className="pl-search-eyebrow" data-kind={page.kind}>
                      <span className="pl-search-dot" aria-hidden="true" />
                      {page.section || 'Docs'}
                    </span>
                    <span className="pl-search-page-title">{page.title}</span>
                  </div>
                  {page.subResults.map((sub) => {
                    const { idx, domId } = nextId()
                    return (
                      <ResultRow
                        key={sub.url}
                        id={domId}
                        href={hrefWithBase(sub.url)}
                        title={sub.title}
                        excerpt={sub.excerpt}
                        active={active === idx}
                        onActivate={() => onItem({ url: sub.url })}
                        onHover={() => setActive(idx)}
                      />
                    )
                  })}
                </div>
              ))}

            {status === 'empty' && (
              <div className="pl-search-empty">
                <p className="pl-search-empty-lead">
                  No matches for <strong>“{deferredQuery.trim()}”</strong>.
                </p>
                <Group label="Try instead">
                  {RECOVERY.map((r) => {
                    const { idx, domId } = nextId()
                    const external = r.url.endsWith('.txt')
                    return (
                      <LinkRow
                        key={r.url}
                        id={domId}
                        href={hrefWithBase(r.url)}
                        title={r.title}
                        section={r.section}
                        kind={r.kind}
                        active={active === idx}
                        onActivate={() => onItem({ url: r.url })}
                        onHover={() => setActive(idx)}
                      />
                    )
                  })}
                </Group>
              </div>
            )}
          </div>

          <div className="pl-search-footer">
            <span className="pl-search-count">
              {status === 'ready'
                ? `${resultCount} result${resultCount === 1 ? '' : 's'}${section ? ` in ${section}` : ''}`
                : status === 'idle'
                  ? 'Type to search'
                  : status === 'empty'
                    ? 'No results'
                    : ''}
            </span>
            <span className="pl-search-legend" aria-hidden="true">
              <kbd>↑</kbd>
              <kbd>↓</kbd> navigate <kbd>↵</kbd> open <kbd>esc</kbd> close
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function Group({ label, children }) {
  return (
    <div className="pl-search-group" role="presentation">
      <div className="pl-search-group-head pl-search-group-head--simple">
        <span className="pl-search-eyebrow pl-search-eyebrow--plain">{label}</span>
      </div>
      {children}
    </div>
  )
}

function ResultRow({ id, href, title, excerpt, active, onActivate, onHover }) {
  return (
    <a
      id={id}
      href={href}
      role="option"
      aria-selected={active}
      data-active={active ? '' : undefined}
      className="pl-search-row"
      onMouseMove={onHover}
      onClick={(e) => {
        e.preventDefault()
        onActivate()
      }}
    >
      <span className="pl-search-row-title">{title}</span>
      {excerpt && (
        <span className="pl-search-row-excerpt" dangerouslySetInnerHTML={{ __html: excerpt }} />
      )}
    </a>
  )
}

function LinkRow({ id, href, title, section, kind, active, onActivate, onHover }) {
  return (
    <a
      id={id}
      href={href}
      role="option"
      aria-selected={active}
      data-active={active ? '' : undefined}
      className="pl-search-row pl-search-row--link"
      onMouseMove={onHover}
      onClick={(e) => {
        e.preventDefault()
        onActivate()
      }}
    >
      <span className="pl-search-eyebrow" data-kind={kind}>
        <span className="pl-search-dot" aria-hidden="true" />
        {section}
      </span>
      <span className="pl-search-row-title">{title}</span>
    </a>
  )
}

function RecentRow({ id, query, active, onActivate, onHover }) {
  return (
    <button
      id={id}
      type="button"
      role="option"
      aria-selected={active}
      data-active={active ? '' : undefined}
      className="pl-search-row pl-search-row--recent"
      onMouseMove={onHover}
      onClick={onActivate}
    >
      <ClockIcon />
      <span className="pl-search-row-title">{query}</span>
    </button>
  )
}

function SearchIcon() {
  return (
    <svg className="pl-search-icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path
        d="M8.5 3a5.5 5.5 0 0 1 4.23 9.02l3.62 3.63a.75.75 0 0 1-1.06 1.06l-3.63-3.62A5.5 5.5 0 1 1 8.5 3Zm0 1.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
        fill="currentColor"
      />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg
      className="pl-search-row-icon"
      viewBox="0 0 20 20"
      width="15"
      height="15"
      aria-hidden="true"
    >
      <path
        d="M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm0 1.5a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm-.75 2.25a.75.75 0 0 1 1.5 0v3.19l2.03 2.03a.75.75 0 1 1-1.06 1.06l-2.25-2.25a.75.75 0 0 1-.22-.53V6.25Z"
        fill="currentColor"
      />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="18"
      height="18"
      aria-hidden="true"
      className="pl-search-msg-icon"
    >
      <path
        d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13ZM10 8.75a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 8.75Zm0-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"
        fill="currentColor"
      />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="18"
      height="18"
      aria-hidden="true"
      className="pl-search-spinner"
    >
      <circle
        cx="10"
        cy="10"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
      />
      <path
        d="M10 3a7 7 0 0 1 7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
