'use client'

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore
} from 'react'
import { useRouter } from 'next/navigation'
import { hrefWithBase, pathWithBase } from '../app/site-config.mjs'

// A Polaris-branded replacement for Nextra's stock Pagefind search. Same engine
// and data, richer result display: each hit carries its section and a type
// marker, results group by page, the panel keeps an initial "Start here" state,
// a recovering empty state, section filter chips, and a keyboard legend. On
// mobile it opens as a full-screen sheet rather than a cramped dropdown.

const PLACEHOLDER = 'Search the docs…'
const MAX_PAGES = 8
const MAX_CANDIDATE_PAGES = 24
const MAX_SUBRESULTS = 5
const SEARCH_OPTIONS = { excerptLength: 14 }
const MAX_FACETS = 8
const RECENT_KEY = 'polaris-docs:recent-searches'
const MAX_RECENT = 5

// Curated entry points for the queryless state, in the protocol's reading order.
const START_HERE = [
  { title: 'Public Testnet Quickstart', url: '/quickstart', section: 'Start Here', kind: 'guide' },
  { title: 'Why Polaris', url: '/why-polaris', section: 'Understand Polaris', kind: 'concept' },
  {
    title: 'Open a Position',
    url: '/using-app/issue',
    section: 'Use Polaris',
    kind: 'guide'
  }
]

// Recovery links for a no-results query.
const RECOVERY = [
  { title: 'FAQ', url: '/resources/faq', section: 'Reference', kind: 'reference' },
  { title: 'Troubleshooting', url: '/troubleshooting', section: 'Reference', kind: 'guide' },
  {
    title: 'Browse the full docs (llms.txt)',
    url: '/llms.txt',
    section: 'Plain text',
    kind: 'reference'
  }
]

const QUERY_ALIASES = new Map([
  ['liquidate', 'liquidation'],
  ['liquidated', 'liquidation'],
  ['liquidating', 'liquidation'],
  ['liquidaton', 'liquidation'],
  ['staking', 'POLAR staking'],
  ['stake', 'POLAR staking'],
  ['stake polar', 'POLAR staking'],
  ['borrow', 'position'],
  ['borrowing', 'position'],
  ['loan', 'position'],
  ['loans', 'position'],
  ['pet', 'pETH'],
  ['p eth', 'pETH'],
  ['polr', 'POLAR'],
  ['risks', 'risk'],
  ['risky', 'risk']
])

const DIRECT_ROUTE_BOOSTS = [
  { query: 'polar', routes: ['/polar', '/polar/tokenomics'] },
  { query: 'peth', routes: ['/peth'] },
  { query: 'liquidation', routes: ['/redemptions-liquidations/liquidations'] },
  { query: 'position', routes: ['/using-app/issue', '/minting/manage-position'] },
  { query: 'trove', routes: ['/using-app/issue', '/minting/manage-position'] },
  { query: 'risk', routes: ['/resources/risk-disclosure'] }
]

const noopSubscribe = () => () => {}
const serverIsMac = () => false
const clientIsMac = () => navigator.userAgent.includes('Mac')

let pagefindPromise = null
function loadPagefind() {
  if (!pagefindPromise) {
    pagefindPromise = (async () => {
      const pf = await import(/* webpackIgnore: true */ pathWithBase('/_pagefind/pagefind.js'))
      await pf.options({ baseUrl: '/' })
      // Warm the filter index so search responses include section facet counts.
      await pf.filters()
      return pf
    })()
  }
  return pagefindPromise
}

function cleanUrl(url) {
  return url.replace(/\.html$/, '').replace(/\.html#/, '#')
}

function cleanExcerpt(excerpt) {
  return excerpt
    ?.replace(/\s+/g, ' ')
    .replace(/^(?:[-.;,:–—]\s*)+/, '')
    .trim()
}

function isExternalLike(url) {
  return /^https?:/.test(url) || url.endsWith('.txt')
}

function normalizeQuery(query) {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function suggestedQueryFor(query) {
  const normalized = normalizeQuery(query)
  if (!normalized) return null
  const suggestion = QUERY_ALIASES.get(normalized)
  return suggestion && normalizeQuery(suggestion) !== normalized ? suggestion : null
}

function normalizedRoute(url) {
  const [pathOnly] = url.split('#')
  return pathOnly.replace(/\/$/, '') || '/'
}

function directRouteBoost(query, url) {
  const normalized = normalizeQuery(query)
  const route = normalizedRoute(url)
  const match = DIRECT_ROUTE_BOOSTS.find((entry) => entry.query === normalized)
  if (!match) return 0
  const index = match.routes.indexOf(route)
  return index === -1 ? 0 : 100 - index
}

function rankPages(pages, query) {
  return pages
    .map((page, index) => ({ page, index, boost: directRouteBoost(query, page.url) }))
    .sort((a, b) => b.boost - a.boost || a.index - b.index)
    .map(({ page }) => page)
    .slice(0, MAX_PAGES)
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
  const [status, setStatus] = useState('idle') // idle | loading | ready | empty | error
  const [error, setError] = useState('')
  const [pages, setPages] = useState([])
  const [resultTotal, setResultTotal] = useState(0)
  const [facets, setFacets] = useState([]) // [{ value, count }]
  const [section, setSection] = useState(null) // active section filter
  const [active, setActive] = useState(-1) // keyboard cursor into navItems
  // The panel (and the recent list) never render during SSR/hydration because it
  // is closed, so reading localStorage in the initializer is mismatch-safe.
  const [recent, setRecent] = useState(() => (typeof window === 'undefined' ? [] : readRecent()))

  const isMac = useSyncExternalStore(noopSubscribe, clientIsMac, serverIsMac)

  // Run the Pagefind query whenever the (deferred) text or active facet changes.
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const term = deferredQuery.trim()
      if (!term) {
        setStatus('idle')
        setPages([])
        setResultTotal(0)
        setFacets([])
        setError('')
        return
      }

      setStatus('loading')

      let pf
      try {
        pf = await loadPagefind()
      } catch {
        if (cancelled) return
        setError(
          'Search runs against the built site. In local dev, run `npm run build` once, then restart `npm run dev`.'
        )
        setResultTotal(0)
        setStatus('error')
        return
      }

      const options = section
        ? { ...SEARCH_OPTIONS, filters: { section: [section] } }
        : SEARCH_OPTIONS
      const response = await pf.debouncedSearch(term, options)
      if (cancelled || !response) return // superseded by a newer keystroke

      const data = await Promise.all(
        response.results.slice(0, MAX_CANDIDATE_PAGES).map((r) => r.data())
      )
      if (cancelled) return

      const nextPages = rankPages(
        data.map((page) => ({
          url: cleanUrl(page.url),
          title: page.meta?.title ?? 'Untitled',
          section: page.meta?.section ?? '',
          kind: page.meta?.kind ?? 'concept',
          subResults: (page.sub_results ?? []).slice(0, MAX_SUBRESULTS).map((sub) => ({
            url: cleanUrl(sub.url),
            title: sub.title,
            excerpt: cleanExcerpt(sub.excerpt)
          }))
        })),
        term
      )

      const sectionFacet = response.totalFilters?.section ?? response.filters?.section ?? {}
      const nextFacets = Object.entries(sectionFacet)
        .filter(([, count]) => count > 0)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, MAX_FACETS)

      setPages(nextPages)
      setResultTotal(response.results.length)
      setFacets(nextFacets)
      setActive(-1)
      setStatus(nextPages.length ? 'ready' : 'empty')
    }

    run()
    return () => {
      cancelled = true
    }
  }, [deferredQuery, section])

  const close = useCallback(() => {
    setOpen(false)
    setActive(-1)
  }, [])

  const clearQuery = useCallback(() => {
    setQuery('')
    setSection(null)
    setActive(-1)
    setError('')
    setOpen(true)
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  const go = useCallback(
    (url) => {
      const committed = query.trim()
      if (committed) {
        writeRecent(committed)
        setRecent(readRecent())
      }
      setQuery('')
      close()
      inputRef.current?.blur()

      if (isExternalLike(url)) {
        location.href = hrefWithBase(url)
        return
      }
      const [pathOnly, hash] = url.split('#')
      const based = hrefWithBase(pathOnly)
      const here = location.pathname.replace(/\/$/, '') === based.replace(/\/$/, '')
      if (here) {
        if (hash) location.hash = hash
      } else {
        router.push(url)
      }
    },
    [close, query, router]
  )

  const aliasSuggestion =
    status === 'ready' || status === 'empty' ? suggestedQueryFor(deferredQuery) : null
  const hasAliasSuggestion = Boolean(aliasSuggestion)

  // Flat, render-order list of navigable targets (keeps keyboard index in sync
  // with the rendered rows below, which use the same source arrays in order).
  const navItems =
    status === 'ready'
      ? [
          ...(aliasSuggestion ? [{ query: aliasSuggestion }] : []),
          ...pages.flatMap((p) => [
            { url: p.url },
            ...p.subResults.filter((s) => s.url !== p.url).map((s) => ({ url: s.url }))
          ])
        ]
      : status === 'idle'
        ? [...recent.map((q) => ({ query: q })), ...START_HERE.map((s) => ({ url: s.url }))]
        : status === 'empty'
          ? [
              ...(aliasSuggestion ? [{ query: aliasSuggestion }] : []),
              ...RECOVERY.map((r) => ({ url: r.url }))
            ]
          : []

  const onItem = useCallback(
    (item) => {
      if (item.query != null) {
        setQuery(item.query)
        setSection(null)
        setOpen(true)
        setActive(-1)
        inputRef.current?.focus({ preventScroll: true })
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
    if (event.key === 'ArrowDown' && navItems.length) {
      event.preventDefault()
      setOpen(true)
      setActive((i) => (i + 1) % navItems.length)
    } else if (event.key === 'ArrowUp' && navItems.length) {
      event.preventDefault()
      setActive((i) => (i <= 0 ? navItems.length - 1 : i - 1))
    } else if (event.key === 'Enter' && navItems.length) {
      event.preventDefault()
      onItem(active >= 0 && navItems[active] ? navItems[active] : navItems[0])
    }
  }

  // Keep the active row in view as the cursor moves.
  useEffect(() => {
    if (active < 0 || !listRef.current) return
    const el = listRef.current.querySelector(`#${CSS.escape(`${id}-i-${active}`)}`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active, id])

  // Close on outside pointer.
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

  const activeId = active >= 0 ? `${id}-i-${active}` : undefined
  const listboxId = `${id}-listbox`

  // Pre-indexed view models so each row knows its keyboard index without any
  // render-time counter mutation. Indices match navItems order exactly.
  const recentRows = recent.map((q, i) => ({ q, index: i }))
  const startRows = START_HERE.map((s, i) => ({ ...s, index: recent.length + i }))
  // Each page is a clickable header (to the page top) followed by its matched
  // section rows. The page-root sub-result is dropped: its excerpt is just the
  // down-weighted synonym block, and the header already links to the top.
  const readyModels = pages.map((page) => ({
    page,
    rows: page.subResults.filter((s) => s.url !== page.url)
  }))
  const readyOffset = hasAliasSuggestion ? 1 : 0
  const modelOffsets = readyModels.map(
    (_, i) => readyOffset + readyModels.slice(0, i).reduce((n, m) => n + 1 + m.rows.length, 0)
  )
  const readyGroups = readyModels.map((m, i) => ({
    page: m.page,
    headIndex: modelOffsets[i],
    rows: m.rows.map((sub, k) => ({ ...sub, index: modelOffsets[i] + 1 + k }))
  }))
  const recoveryOffset = hasAliasSuggestion ? 1 : 0
  const recoveryRows = RECOVERY.map((r, i) => ({ ...r, index: recoveryOffset + i }))
  const countLabel =
    status === 'ready'
      ? `${resultTotal > pages.length ? `Top ${pages.length} of ${resultTotal}` : `${pages.length} shown`}${section ? ` in ${section}` : ''}`
      : status === 'idle'
        ? 'Type to search'
        : status === 'empty'
          ? 'No results'
          : ''
  const liveStatus =
    status === 'ready'
      ? countLabel
      : status === 'empty'
        ? aliasSuggestion
          ? `No results. Try searching for ${aliasSuggestion}.`
          : 'No results.'
        : status === 'loading'
          ? 'Searching.'
          : status === 'error'
            ? error
            : ''

  return (
    <div ref={containerRef} className="nextra-search pl-search">
      <span id={`${id}-status`} className="pl-sr-only" aria-live="polite" aria-atomic="true">
        {liveStatus}
      </span>
      <div className="pl-search-field">
        <SearchIcon />
        <input
          ref={inputRef}
          type="search"
          spellCheck={false}
          autoComplete="off"
          className={`pl-search-input${query ? ' pl-search-input--clearable' : ''}`}
          placeholder={PLACEHOLDER}
          value={query}
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          aria-label="Search the documentation"
          onChange={(e) => {
            setQuery(e.target.value)
            setSection(null)
            setOpen(true)
          }}
          onFocus={() => {
            setOpen(true)
            // Warm the index so the first keystroke doesn't pay the load cost.
            loadPagefind().catch(() => {})
          }}
          onKeyDown={onKeyDown}
        />
        {query && (
          <button
            type="button"
            className="pl-search-clear"
            aria-label="Clear search"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clearQuery}
          >
            <CloseIcon />
          </button>
        )}
        <kbd className="pl-search-kbd" aria-hidden="true">
          {isMac ? <span className="pl-search-cmd">⌘</span> : 'Ctrl '}K
        </kbd>
      </div>

      {open && (
        <div className="nextra-search-results pl-search-results">
          <button
            type="button"
            className="pl-search-close"
            aria-label="Close search"
            onClick={() => {
              close()
              inputRef.current?.blur()
            }}
          >
            <CloseIcon />
          </button>

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
            id={listboxId}
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
                {recentRows.length > 0 && (
                  <Group label="Recent">
                    {recentRows.map((row) => (
                      <RecentRow
                        key={row.q}
                        id={`${id}-i-${row.index}`}
                        query={row.q}
                        active={active === row.index}
                        onActivate={() => onItem({ query: row.q })}
                        onHover={() => setActive(row.index)}
                      />
                    ))}
                  </Group>
                )}
                <Group label="Start here">
                  {startRows.map((row) => (
                    <LinkRow
                      key={row.url}
                      id={`${id}-i-${row.index}`}
                      href={hrefWithBase(row.url)}
                      title={row.title}
                      section={row.section}
                      kind={row.kind}
                      active={active === row.index}
                      onActivate={() => onItem({ url: row.url })}
                      onHover={() => setActive(row.index)}
                    />
                  ))}
                </Group>
              </>
            )}

            {status === 'ready' && (
              <>
                {aliasSuggestion && (
                  <Group label="Suggested search">
                    <QuerySuggestionRow
                      id={`${id}-i-0`}
                      query={aliasSuggestion}
                      active={active === 0}
                      onActivate={() => onItem({ query: aliasSuggestion })}
                      onHover={() => setActive(0)}
                    />
                  </Group>
                )}
                {readyGroups.map(({ page, headIndex, rows }) => (
                  <div key={page.url} className="pl-search-group" role="presentation">
                    <a
                      id={`${id}-i-${headIndex}`}
                      href={hrefWithBase(page.url)}
                      role="option"
                      aria-selected={active === headIndex}
                      data-active={active === headIndex ? '' : undefined}
                      className="pl-search-group-head pl-search-group-head--link"
                      onMouseMove={() => setActive(headIndex)}
                      onClick={(e) => {
                        e.preventDefault()
                        onItem({ url: page.url })
                      }}
                    >
                      {page.section && (
                        <span className="pl-search-eyebrow" data-kind={page.kind}>
                          <span className="pl-search-dot" aria-hidden="true" />
                          {page.section}
                        </span>
                      )}
                      <span className="pl-search-page-title">{page.title}</span>
                    </a>
                    {rows.map((row) => (
                      <ResultRow
                        key={row.url}
                        id={`${id}-i-${row.index}`}
                        href={hrefWithBase(row.url)}
                        title={row.title}
                        excerpt={row.excerpt}
                        active={active === row.index}
                        onActivate={() => onItem({ url: row.url })}
                        onHover={() => setActive(row.index)}
                      />
                    ))}
                  </div>
                ))}
              </>
            )}

            {status === 'empty' && (
              <div className="pl-search-empty">
                <p className="pl-search-empty-lead">
                  No matches for <strong>“{deferredQuery.trim()}”</strong>.
                </p>
                {aliasSuggestion && (
                  <Group label="Suggested search">
                    <QuerySuggestionRow
                      id={`${id}-i-0`}
                      query={aliasSuggestion}
                      active={active === 0}
                      onActivate={() => onItem({ query: aliasSuggestion })}
                      onHover={() => setActive(0)}
                    />
                  </Group>
                )}
                <Group label="Try instead">
                  {recoveryRows.map((row) => (
                    <LinkRow
                      key={row.url}
                      id={`${id}-i-${row.index}`}
                      href={hrefWithBase(row.url)}
                      title={row.title}
                      section={row.section}
                      kind={row.kind}
                      active={active === row.index}
                      onActivate={() => onItem({ url: row.url })}
                      onHover={() => setActive(row.index)}
                    />
                  ))}
                </Group>
              </div>
            )}
          </div>

          <div className="pl-search-footer">
            <span className="pl-search-count">{countLabel}</span>
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

function QuerySuggestionRow({ id, query, active, onActivate, onHover }) {
  return (
    <button
      id={id}
      type="button"
      role="option"
      aria-selected={active}
      data-active={active ? '' : undefined}
      className="pl-search-row pl-search-row--query"
      onMouseMove={onHover}
      onClick={onActivate}
    >
      <SearchGlyphIcon />
      <span className="pl-search-row-title">Search for “{query}”</span>
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

function SearchGlyphIcon() {
  return (
    <svg
      className="pl-search-row-icon"
      viewBox="0 0 20 20"
      width="15"
      height="15"
      aria-hidden="true"
    >
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path
        d="M5.7 5.7a.75.75 0 0 1 1.06 0L10 8.94l3.24-3.24a.75.75 0 1 1 1.06 1.06L11.06 10l3.24 3.24a.75.75 0 1 1-1.06 1.06L10 11.06l-3.24 3.24a.75.75 0 0 1-1.06-1.06L8.94 10 5.7 6.76a.75.75 0 0 1 0-1.06Z"
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
