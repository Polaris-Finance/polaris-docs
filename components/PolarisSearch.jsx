'use client'

import { DialogTitle, Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { ChevronDown, Clock3, Filter, Info, RotateCw, Search, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore
} from 'react'
import { hrefWithBase, pathWithBase } from '../app/site-config.mjs'
import { kindForPath, sectionForPath } from '../app/search-taxonomy.mjs'
import { DocsOverlay } from './navigation/DocsOverlay'

const PLACEHOLDER = 'Search the docs...'
const MAX_PAGES = 8
const MAX_CANDIDATE_PAGES = 24
const MAX_SUBRESULTS = 5
const SEARCH_OPTIONS = { excerptLength: 14 }
const MAX_FACETS = 8
const RECENT_KEY = 'polaris-docs:recent-searches'
const MAX_RECENT = 5

function curate(title, url) {
  return { title, url, section: sectionForPath(url), kind: kindForPath(url) }
}

const START_HERE = [
  curate('Why pETH', '/overview/why-peth'),
  curate('pETH', '/core-assets/peth'),
  curate('Using the Testnet', '/testnet/guide')
]

const RECOVERY = [
  curate('Polaris 101', '/polaris-101'),
  curate('Risks', '/risks'),
  curate('Browse the full docs (llms.txt)', '/llms.txt')
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
  { query: 'polar', routes: ['/core-assets/polar', '/architecture/tokenomics'] },
  { query: 'peth', routes: ['/core-assets/peth'] },
  { query: 'liquidation', routes: ['/design/liquidations'] },
  { query: 'position', routes: ['/testnet/mint'] },
  { query: 'trove', routes: ['/testnet/mint'] },
  { query: 'risk', routes: ['/risks'] }
]

const noopSubscribe = () => () => {}
const serverIsMac = () => false
const clientIsMac = () => /Mac|iPhone|iPad/.test(navigator.platform)

let pagefindPromise = null
function loadPagefind() {
  if (!pagefindPromise) {
    pagefindPromise = (async () => {
      const pagefind = await import(
        /* webpackIgnore: true */ pathWithBase('/_pagefind/pagefind.js')
      )
      await pagefind.options({ baseUrl: '/' })
      await pagefind.filters()
      return pagefind
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
  return /^https?:/.test(url) || /\.(?:txt|json)(?:#.*)?$/.test(url)
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
      ? parsed.filter((query) => typeof query === 'string').slice(0, MAX_RECENT)
      : []
  } catch {
    return []
  }
}

function writeRecent(query) {
  try {
    const next = [query, ...readRecent().filter((item) => item !== query)].slice(0, MAX_RECENT)
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // Recent queries are local-only and best-effort.
  }
}

function clearRecentStorage() {
  try {
    window.localStorage.removeItem(RECENT_KEY)
  } catch {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }
}

function focusDestination(hash) {
  window.setTimeout(() => {
    const target = hash
      ? document.getElementById(hash)
      : (document.querySelector('article h1, main h1') ?? document.querySelector('main'))
    if (!target) return
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: false })
  }, 500)
}

export function PolarisSearch({ open, onOpenChange }) {
  const router = useRouter()
  const id = useId()
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [pages, setPages] = useState([])
  const [resultTotal, setResultTotal] = useState(0)
  const [facets, setFacets] = useState([])
  const [section, setSection] = useState(null)
  const [active, setActive] = useState(-1)
  const [retryToken, setRetryToken] = useState(0)
  const [recent, setRecent] = useState([])
  const isMac = useSyncExternalStore(noopSubscribe, clientIsMac, serverIsMac)

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() =>
      inputRef.current?.focus({ preventScroll: true })
    )
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => setRecent(readRecent()))
    return () => window.cancelAnimationFrame(frame)
  }, [open])

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
      setError('')

      try {
        const pagefind = await loadPagefind()
        const options = section
          ? { ...SEARCH_OPTIONS, filters: { section: [section] } }
          : SEARCH_OPTIONS
        const response = await pagefind.debouncedSearch(term, options)
        if (cancelled || !response) return

        const data = await Promise.all(
          response.results.slice(0, MAX_CANDIDATE_PAGES).map((result) => result.data())
        )
        if (cancelled) return

        const nextPages = rankPages(
          data.map((page) => ({
            url: cleanUrl(page.url),
            title: page.meta?.title ?? 'Untitled',
            section: page.meta?.section ?? '',
            kind: page.meta?.kind ?? 'concept',
            subResults: (page.sub_results ?? []).slice(0, MAX_SUBRESULTS).map((subResult) => ({
              url: cleanUrl(subResult.url),
              title: subResult.title,
              excerpt: cleanExcerpt(subResult.excerpt)
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
      } catch {
        if (cancelled) return
        setError('The local search index is unavailable.')
        setResultTotal(0)
        setPages([])
        setStatus('error')
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [deferredQuery, retryToken, section])

  const close = useCallback(() => {
    setActive(-1)
    onOpenChange(false)
  }, [onOpenChange])

  const clearQuery = useCallback(() => {
    setQuery('')
    setSection(null)
    setActive(-1)
    setError('')
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  const retry = useCallback(() => {
    pagefindPromise = null
    setRetryToken((value) => value + 1)
  }, [])

  const clearRecent = useCallback(() => {
    clearRecentStorage()
    setRecent([])
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

      if (isExternalLike(url)) {
        window.location.href = hrefWithBase(url)
        return
      }

      const [pathOnly, hash] = url.split('#')
      const based = hrefWithBase(pathOnly)
      const here = window.location.pathname.replace(/\/$/, '') === based.replace(/\/$/, '')

      if (here) {
        if (hash) {
          if (window.location.hash !== `#${hash}`) window.location.hash = hash
          focusDestination(hash)
        } else {
          window.scrollTo({ top: 0, behavior: 'auto' })
          focusDestination()
        }
        return
      }

      router.push(hash ? `${pathOnly}#${hash}` : pathOnly)
    },
    [close, query, router]
  )

  const aliasSuggestion =
    status === 'ready' || status === 'empty' ? suggestedQueryFor(deferredQuery) : null
  const hasAliasSuggestion = Boolean(aliasSuggestion)

  const navItems =
    status === 'ready'
      ? [
          ...(aliasSuggestion ? [{ query: aliasSuggestion }] : []),
          ...pages.flatMap((page) => [
            { url: page.url },
            ...page.subResults
              .filter((subResult) => subResult.url !== page.url)
              .map((subResult) => ({ url: subResult.url }))
          ])
        ]
      : status === 'idle'
        ? [
            ...recent.map((item) => ({ query: item })),
            ...START_HERE.map((item) => ({ url: item.url }))
          ]
        : status === 'empty'
          ? [
              ...(aliasSuggestion ? [{ query: aliasSuggestion }] : []),
              ...RECOVERY.map((item) => ({ url: item.url }))
            ]
          : []

  const onItem = useCallback(
    (item) => {
      if (item.query != null) {
        setQuery(item.query)
        setSection(null)
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
      event.preventDefault()
      event.stopPropagation()
      close()
      return
    }
    if (event.key === 'ArrowDown' && navItems.length) {
      event.preventDefault()
      setActive((index) => (index + 1) % navItems.length)
    } else if (event.key === 'ArrowUp' && navItems.length) {
      event.preventDefault()
      setActive((index) => (index <= 0 ? navItems.length - 1 : index - 1))
    } else if (event.key === 'Enter' && navItems.length) {
      event.preventDefault()
      onItem(active >= 0 && navItems[active] ? navItems[active] : navItems[0])
    }
  }

  useEffect(() => {
    if (active < 0 || !listRef.current) return
    const element = listRef.current.querySelector(`#${CSS.escape(`${id}-item-${active}`)}`)
    element?.scrollIntoView({ block: 'nearest' })
  }, [active, id])

  const activeId = active >= 0 ? `${id}-item-${active}` : undefined
  const listboxId = `${id}-listbox`
  const recentRows = recent.map((item, index) => ({ query: item, index }))
  const startRows = START_HERE.map((item, index) => ({ ...item, index: recent.length + index }))
  const readyModels = pages.map((page) => ({
    page,
    rows: page.subResults.filter((subResult) => subResult.url !== page.url)
  }))
  const readyOffset = hasAliasSuggestion ? 1 : 0
  const modelOffsets = readyModels.map(
    (_, index) =>
      readyOffset +
      readyModels.slice(0, index).reduce((count, model) => count + 1 + model.rows.length, 0)
  )
  const readyGroups = readyModels.map((model, index) => ({
    page: model.page,
    headIndex: modelOffsets[index],
    rows: model.rows.map((subResult, rowIndex) => ({
      ...subResult,
      index: modelOffsets[index] + 1 + rowIndex
    }))
  }))
  const recoveryOffset = hasAliasSuggestion ? 1 : 0
  const recoveryRows = RECOVERY.map((item, index) => ({ ...item, index: recoveryOffset + index }))
  const countLabel =
    status === 'ready'
      ? `${resultTotal > pages.length ? `Top ${pages.length} of ${resultTotal}` : `${pages.length} shown`}${section ? ` in ${section}` : ''}`
      : status === 'idle'
        ? 'Type to search'
        : status === 'empty'
          ? 'No results'
          : status === 'error'
            ? 'Search unavailable'
            : 'Searching'
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
    <DocsOverlay kind="search" open={open} onClose={close} initialFocus={inputRef}>
      <div className="pl-search-dialog">
        <DialogTitle className="pl-sr-only">Search Polaris documentation</DialogTitle>
        <span id={`${id}-status`} className="pl-sr-only" aria-live="polite" aria-atomic="true">
          {liveStatus}
        </span>
        <span id={`${id}-help`} className="pl-sr-only">
          Use the Up and Down arrow keys to move through results, Enter to open the selected result,
          and Escape to close. Press slash or {isMac ? 'Command' : 'Control'}+K from anywhere to
          open search.
        </span>

        <div className="pl-search-dialog-header">
          <div className="pl-search-field">
            <Search className="pl-search-icon" aria-hidden="true" size={19} strokeWidth={1.8} />
            <input
              ref={inputRef}
              type="search"
              spellCheck={false}
              autoComplete="off"
              className="pl-search-input"
              placeholder={PLACEHOLDER}
              value={query}
              role="combobox"
              aria-expanded={open}
              aria-controls={listboxId}
              aria-activedescendant={activeId}
              aria-autocomplete="list"
              aria-label="Search the documentation"
              aria-describedby={`${id}-help`}
              onChange={(event) => {
                setQuery(event.target.value)
                setSection(null)
                setActive(-1)
              }}
              onFocus={() => loadPagefind().catch(() => {})}
              onKeyDown={onKeyDown}
            />
            {query ? (
              <button
                type="button"
                className="pl-search-clear"
                aria-label="Clear search"
                onClick={clearQuery}
              >
                <X aria-hidden="true" size={18} strokeWidth={1.8} />
              </button>
            ) : (
              <kbd className="pl-search-kbd" aria-hidden="true">
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            )}
          </div>
          <button
            type="button"
            className="pl-overlay-icon-button"
            aria-label="Close search"
            onClick={close}
          >
            <X aria-hidden="true" size={20} strokeWidth={1.8} />
          </button>
        </div>

        {facets.length > 1 && status !== 'idle' ? (
          <div className="pl-search-toolbar">
            <Popover className="pl-search-filter">
              <PopoverButton
                className="pl-search-filter-button"
                aria-label={`Filter search results by section: ${section ?? 'All sections'}`}
              >
                <Filter aria-hidden="true" size={15} strokeWidth={1.8} />
                {section ?? 'All sections'}
                <ChevronDown aria-hidden="true" size={14} strokeWidth={1.8} />
              </PopoverButton>
              <PopoverPanel
                transition
                className="pl-search-filter-panel"
                aria-label="Filter by section"
              >
                <button
                  type="button"
                  aria-pressed={section === null}
                  onClick={() => setSection(null)}
                >
                  <span>All sections</span>
                  <span>{resultTotal}</span>
                </button>
                {facets.map((facet) => (
                  <button
                    key={facet.value}
                    type="button"
                    aria-pressed={section === facet.value}
                    onClick={() => setSection(facet.value)}
                  >
                    <span>{facet.value}</span>
                    <span>{facet.count}</span>
                  </button>
                ))}
              </PopoverPanel>
            </Popover>
          </div>
        ) : null}

        <div ref={listRef} className="pl-search-list">
          {status === 'error' ? (
            <div className="pl-search-message">
              <Info aria-hidden="true" size={19} strokeWidth={1.8} />
              <div>
                <strong>Search is unavailable</strong>
                <p>{error}</p>
                {process.env.NODE_ENV !== 'production' ? (
                  <p className="pl-search-dev-help">
                    Run `npm run build` once, then restart `npm run dev`.
                  </p>
                ) : null}
                <div className="pl-search-message-actions">
                  <button type="button" onClick={retry}>
                    <RotateCw aria-hidden="true" size={15} strokeWidth={1.8} />
                    Retry
                  </button>
                  <button type="button" onClick={() => onItem({ url: '/' })}>
                    Browse docs
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {status === 'loading' ? <SearchSkeleton /> : null}

          {status === 'idle' && recentRows.length ? (
            <div className="pl-search-group-label-row">
              <span id={`${id}-recent`} className="pl-search-group-label">
                Recent
              </span>
              <button
                type="button"
                className="pl-search-clear-recent"
                aria-label="Clear recent searches"
                onClick={clearRecent}
              >
                <Trash2 aria-hidden="true" size={14} strokeWidth={1.8} />
                Clear
              </button>
            </div>
          ) : null}

          {status === 'empty' ? (
            <p className="pl-search-empty-lead">
              No matches for <strong>“{deferredQuery.trim()}”</strong>.
            </p>
          ) : null}

          <div id={listboxId} role="listbox" aria-label="Search results">
            {status === 'idle' ? (
              <>
                {recentRows.length ? (
                  <div className="pl-search-group" role="group" aria-labelledby={`${id}-recent`}>
                    {recentRows.map((row) => (
                      <SearchOption
                        key={row.query}
                        id={`${id}-item-${row.index}`}
                        title={row.query}
                        icon={<Clock3 aria-hidden="true" size={15} strokeWidth={1.8} />}
                        active={active === row.index}
                        onActivate={() => onItem({ query: row.query })}
                        onHover={() => setActive(row.index)}
                      />
                    ))}
                  </div>
                ) : null}
                <ResultGroup id={`${id}-start`} label="Start here">
                  {startRows.map((row) => (
                    <SearchLinkOption
                      key={row.url}
                      id={`${id}-item-${row.index}`}
                      href={hrefWithBase(row.url)}
                      title={row.title}
                      section={row.section}
                      kind={row.kind}
                      active={active === row.index}
                      onActivate={() => onItem({ url: row.url })}
                      onHover={() => setActive(row.index)}
                    />
                  ))}
                </ResultGroup>
              </>
            ) : null}

            {status === 'ready' ? (
              <>
                {aliasSuggestion ? (
                  <ResultGroup id={`${id}-suggested`} label="Suggested search">
                    <SearchOption
                      id={`${id}-item-0`}
                      title={`Search for “${aliasSuggestion}”`}
                      icon={<Search aria-hidden="true" size={15} strokeWidth={1.8} />}
                      active={active === 0}
                      onActivate={() => onItem({ query: aliasSuggestion })}
                      onHover={() => setActive(0)}
                    />
                  </ResultGroup>
                ) : null}
                {readyGroups.map(({ page, headIndex, rows }) => (
                  <ResultGroup
                    key={page.url}
                    id={`${id}-group-${headIndex}`}
                    label={page.section || 'Page'}
                  >
                    <SearchLinkOption
                      id={`${id}-item-${headIndex}`}
                      href={hrefWithBase(page.url)}
                      title={page.title}
                      section={page.section}
                      kind={page.kind}
                      page
                      active={active === headIndex}
                      onActivate={() => onItem({ url: page.url })}
                      onHover={() => setActive(headIndex)}
                    />
                    {rows.map((row) => (
                      <SearchLinkOption
                        key={row.url}
                        id={`${id}-item-${row.index}`}
                        href={hrefWithBase(row.url)}
                        title={row.title}
                        excerpt={row.excerpt}
                        child
                        active={active === row.index}
                        onActivate={() => onItem({ url: row.url })}
                        onHover={() => setActive(row.index)}
                      />
                    ))}
                  </ResultGroup>
                ))}
              </>
            ) : null}

            {status === 'empty' ? (
              <>
                {aliasSuggestion ? (
                  <ResultGroup id={`${id}-empty-suggested`} label="Suggested search">
                    <SearchOption
                      id={`${id}-item-0`}
                      title={`Search for “${aliasSuggestion}”`}
                      icon={<Search aria-hidden="true" size={15} strokeWidth={1.8} />}
                      active={active === 0}
                      onActivate={() => onItem({ query: aliasSuggestion })}
                      onHover={() => setActive(0)}
                    />
                  </ResultGroup>
                ) : null}
                <ResultGroup id={`${id}-recovery`} label="Try instead">
                  {recoveryRows.map((row) => (
                    <SearchLinkOption
                      key={row.url}
                      id={`${id}-item-${row.index}`}
                      href={hrefWithBase(row.url)}
                      title={row.title}
                      section={row.section}
                      kind={row.kind}
                      active={active === row.index}
                      onActivate={() => onItem({ url: row.url })}
                      onHover={() => setActive(row.index)}
                    />
                  ))}
                </ResultGroup>
              </>
            ) : null}
          </div>
        </div>

        <div className="pl-search-footer">
          <span className="pl-search-count">{countLabel}</span>
          <span className="pl-search-legend" aria-hidden="true">
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate <kbd>↵</kbd> open <kbd>esc</kbd> close
          </span>
        </div>
      </div>
    </DocsOverlay>
  )
}

function ResultGroup({ children, id, label }) {
  return (
    <div className="pl-search-group" role="group" aria-labelledby={id}>
      <div className="pl-search-group-label-row">
        <span id={id} className="pl-search-group-label">
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}

function SearchOption({ active, icon, id, onActivate, onHover, title }) {
  return (
    <button
      id={id}
      type="button"
      role="option"
      tabIndex={-1}
      aria-selected={active}
      data-active={active ? 'true' : undefined}
      className="pl-search-row"
      onMouseEnter={onHover}
      onClick={onActivate}
    >
      {icon ? <span className="pl-search-row-icon">{icon}</span> : null}
      <span className="pl-search-row-title">{title}</span>
    </button>
  )
}

function SearchLinkOption({
  active,
  child,
  excerpt,
  href,
  id,
  kind,
  onActivate,
  onHover,
  page,
  section,
  title
}) {
  return (
    <a
      id={id}
      href={href}
      role="option"
      tabIndex={-1}
      aria-selected={active}
      data-active={active ? 'true' : undefined}
      data-child={child ? 'true' : undefined}
      data-page={page ? 'true' : undefined}
      className="pl-search-row pl-search-row--link"
      onMouseEnter={onHover}
      onClick={(event) => {
        event.preventDefault()
        onActivate()
      }}
    >
      {section ? (
        <span className="pl-search-context" data-kind={kind}>
          <span className="pl-search-dot" aria-hidden="true" />
          {section}
        </span>
      ) : null}
      <span className="pl-search-row-title">{title}</span>
      {excerpt ? (
        <span className="pl-search-row-excerpt" dangerouslySetInnerHTML={{ __html: excerpt }} />
      ) : null}
    </a>
  )
}

function SearchSkeleton() {
  return (
    <div className="pl-search-skeleton" aria-hidden="true">
      {[0, 1, 2, 3].map((item) => (
        <div key={item}>
          <span />
          <span />
        </div>
      ))}
    </div>
  )
}
