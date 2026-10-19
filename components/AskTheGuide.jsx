'use client'

import { Fragment, useCallback, useEffect, useId, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ASK_GUIDE_ENDPOINT, SITE_URL } from '../app/site-config.mjs'
import { ClickToPlayVideo } from './ClickToPlayVideo'

// Videos the guide may embed with a [[video:id]] tag on its own line. The ids and
// descriptions must match the VISUALS list in assistant/src/rules.js.
const VIDEOS = {
  home: [
    '/videos/home.mp4',
    'Polaris flow from swapping ETH for pETH to minting pAssets, splitting pETH, and entering stewardship.'
  ],
  peth: [
    '/videos/peth.mp4',
    'The pETH bonding curve at two supply levels, with each spot price separated into the fpETH floor component and vpETH market premium.'
  ],
  fpeth: [
    '/videos/fpeth.mp4',
    'How fpETH isolates the floor component as the pETH supply and spot price change along the bonding curve.'
  ],
  vpeth: [
    '/videos/vpeth.mp4',
    'How vpETH represents the changing market premium between the pETH spot price and floor price along the bonding curve.'
  ],
  'bonding-curve': ['/videos/bonding-curve.mp4', 'Bonding Curve'],
  'earn-pools': [
    '/videos/earn-pools.mp4',
    'How Earn Pools combine minter interest and liquidation gains'
  ],
  'reserve-loans': ['/videos/reserve-loans.mp4', 'Reserve Loans'],
  'adaptive-peg-defence': [
    '/videos/adaptive-peg-defence.mp4',
    'How Adaptive Peg Defence adjusts minting and redemption incentives to move pAssets back toward their target price'
  ],
  't-swap': [
    '/videos/testnet/swap.mp4',
    'A walkthrough of a swap from ETH to pETH, from approval to confirmation.'
  ],
  't-mint': [
    '/videos/testnet/mint.mp4',
    'A walkthrough of minting USDp against pETH collateral, from approval to an open mint position.'
  ],
  't-split': ['/videos/testnet/split.mp4', 'A walkthrough of splitting pETH into fpETH and vpETH.'],
  't-reserve-loan': [
    '/videos/testnet/reserve-loan.mp4',
    'A walkthrough of opening a Reserve Loan, borrowing ETH against fpETH collateral.'
  ],
  't-spolar': [
    '/videos/testnet/spolar.mp4',
    'A walkthrough of staking POLAR into a new sPOLAR position.'
  ],
  't-vpeth': [
    '/videos/testnet/vpeth.mp4',
    'A walkthrough of supplying vpETH to the vpETH Lending Market, then the Borrow & Hedge actions on the same page.'
  ],
  't-liquidity': [
    '/videos/testnet/liquidity.mp4',
    'A walkthrough of adding liquidity to the USDp/ETH pool, approving each token first.'
  ],
  't-advanced': [
    '/videos/testnet/advanced.mp4',
    'A walkthrough of the Advanced section, buying USDp at peg with pETH.'
  ],
  't-dashboard': [
    '/videos/testnet/dashboard.mp4',
    'A walkthrough of the testnet Dashboard, showing balances and positions grouped by type.'
  ],
  't-analytics': [
    '/videos/testnet/analytics.mp4',
    'A walkthrough of the analytics Overview, exploring how value flows through Polaris.'
  ],
  't-guide': [
    '/videos/testnet/guide.mp4',
    'A walkthrough of the in-app Guide, filtering recommended actions by goal.'
  ]
}

const SUGGESTIONS = [
  'What is the difference between pETH, fpETH and vpETH?',
  'Can a Reserve Loan be liquidated?',
  'Where does Earn Pool yield come from?'
]

const MAX_HISTORY = 6

function escapeHtml(text) {
  return text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  )
}

// Links to the docs open in this tab as a relative path; anything else opens a new tab.
function linkHtml(label, href) {
  const docsPrefix = SITE_URL.replace(/\/$/, '')
  if (href.startsWith(docsPrefix)) {
    const path = href.slice(docsPrefix.length) || '/'
    return `<a href="${path}">${label}</a>`
  }
  return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`
}

function inline(text) {
  let s = escapeHtml(text)
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>')
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (m, label, href) => linkHtml(label, href))
  return s
}

// Small Markdown subset: paragraphs, lists, bold, italics, code, links, tables.
function markdownToHtml(text) {
  const lines = text.replace(/\r/g, '').split('\n')
  let html = ''
  let para = []
  let list = null
  let table = []
  const flushPara = () => {
    if (para.length) html += `<p>${inline(para.join(' '))}</p>`
    para = []
  }
  const flushList = () => {
    if (list) {
      html += `<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`
    }
    list = null
  }
  const flushTable = () => {
    if (!table.length) return
    const rows = table.filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r))
    const cells = (r) =>
      r
        .replace(/^\s*\||\|\s*$/g, '')
        .split('|')
        .map((c) => inline(c.trim()))
    html += `<div class="pl-guide-table"><table>${rows
      .map(
        (r, i) =>
          `<tr>${cells(r)
            .map((c) => (i ? `<td>${c}</td>` : `<th>${c}</th>`))
            .join('')}</tr>`
      )
      .join('')}</table></div>`
    table = []
  }
  for (const line of lines) {
    let m
    if (/^\s*\|.*\|\s*$/.test(line)) {
      flushPara()
      flushList()
      table.push(line)
      continue
    }
    flushTable()
    if (!line.trim()) {
      flushPara()
      flushList()
    } else if ((m = line.match(/^#{1,6}\s+(.*)/))) {
      flushPara()
      flushList()
      html += `<p><strong>${inline(m[1])}</strong></p>`
    } else if ((m = line.match(/^\s*[-*•]\s+(.*)/))) {
      flushPara()
      if (!list || list.tag !== 'ul') {
        flushList()
        list = { tag: 'ul', items: [] }
      }
      list.items.push(m[1])
    } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)/))) {
      flushPara()
      if (!list || list.tag !== 'ol') {
        flushList()
        list = { tag: 'ol', items: [] }
      }
      list.items.push(m[1])
    } else if (list) {
      list.items[list.items.length - 1] += ` ${line.trim()}`
    } else {
      para.push(line.trim())
    }
  }
  flushPara()
  flushList()
  flushTable()
  return html
}

// Split an answer into text blocks and video tags. A tag still being streamed
// ("[[vid…") is hidden until it is complete.
function splitAnswer(text) {
  const clean = text.replace(/\[\[[^\]\n]*$/, '')
  const parts = []
  let buffer = []
  for (const line of clean.split('\n')) {
    const m = line.match(/^\s*\[\[video:([a-z0-9-]+)\]\]\s*$/)
    if (m) {
      if (buffer.length) parts.push({ type: 'text', text: buffer.join('\n') })
      buffer = []
      if (VIDEOS[m[1]]) parts.push({ type: 'video', id: m[1] })
    } else {
      buffer.push(line.replace(/\[\[video:[a-z0-9-]+\]\]/g, ''))
    }
  }
  if (buffer.length) parts.push({ type: 'text', text: buffer.join('\n') })
  return parts
}

function Answer({ text }) {
  return splitAnswer(text).map((part, i) =>
    part.type === 'video' ? (
      <ClickToPlayVideo key={`v-${part.id}`} src={VIDEOS[part.id][0]} alt={VIDEOS[part.id][1]} />
    ) : (
      <div key={`t-${i}`} dangerouslySetInnerHTML={{ __html: markdownToHtml(part.text) }} />
    )
  )
}

const ERRORS = {
  rate_limited: 'You have reached the daily question limit. Please come back tomorrow.',
  too_long: 'That question is too long. Please shorten it.',
  default: 'The guide could not answer right now. Please try again.'
}

export function AskTheGuide() {
  const pathname = usePathname()
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [turns, setTurns] = useState([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const launcherRef = useRef(null)
  const abortRef = useRef(null)
  const askRef = useRef(null)
  const panelRef = useRef(null)

  // Focus returns to the launcher only when closing from the keyboard (Escape).
  const close = useCallback((fromKeyboard = false) => {
    setOpen(false)
    if (fromKeyboard) window.requestAnimationFrame(() => launcherRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!open) return undefined
    inputRef.current?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') close(true)
    }
    // A click or tap anywhere outside the panel closes it.
    const onPointerDown = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) close()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open, close])

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [turns, pending, error])

  useEffect(() => () => abortRef.current?.abort(), [])

  async function ask(question) {
    const text = question.trim()
    if (!text || pending !== null) return
    // Keep strict user/assistant alternation: a question that got no answer is dropped.
    const history = [...turns, { role: 'user', content: text }]
      .filter((turn, i, all) => !(turn.role === 'user' && all[i + 1]?.role === 'user'))
      .slice(-MAX_HISTORY)
    if (history[0].role !== 'user') history.shift()
    setTurns((prev) => [...prev, { role: 'user', content: text }])
    setDraft('')
    setError('')
    setPending('')
    const controller = new AbortController()
    abortRef.current = controller
    let answer = ''
    try {
      const response = await fetch(ASK_GUIDE_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history, page: pathname }),
        signal: controller.signal
      })
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'default')
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        answer += decoder.decode(value, { stream: true })
        setPending(answer)
      }
      if (!answer.trim()) throw new Error('default')
      setTurns((prev) => [...prev, { role: 'assistant', content: answer }])
    } catch (err) {
      if (err.name !== 'AbortError') {
        if (answer.trim()) setTurns((prev) => [...prev, { role: 'assistant', content: answer }])
        setError(ERRORS[err.message] || ERRORS.default)
      }
    } finally {
      setPending(null)
      abortRef.current = null
    }
  }

  function onSubmit(event) {
    event.preventDefault()
    ask(draft)
  }

  function onKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      ask(draft)
    }
  }

  function reset() {
    abortRef.current?.abort()
    setTurns([])
    setPending(null)
    setError('')
    inputRef.current?.focus()
  }

  // The search dialog's "Ask" row sends its query here (see PolarisSearch.jsx).
  useEffect(() => {
    askRef.current = ask
  })

  useEffect(() => {
    const onAsk = (event) => {
      setOpen(true)
      askRef.current?.(String(event.detail || ''))
    }
    window.addEventListener('pl-guide-ask', onAsk)
    return () => window.removeEventListener('pl-guide-ask', onAsk)
  }, [])

  if (!ASK_GUIDE_ENDPOINT) return null

  const empty = turns.length === 0 && pending === null

  return (
    <>
      {!open ? (
        <button
          ref={launcherRef}
          type="button"
          className="pl-guide-launcher"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          Any questions?
        </button>
      ) : null}

      {open ? (
        <section
          ref={panelRef}
          className="pl-guide"
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
        >
          <header className="pl-guide-header">
            <h2 id={titleId} className="pl-guide-title">
              Ask in any language
            </h2>
            <div className="pl-guide-header-actions">
              {!empty ? (
                <button type="button" className="pl-guide-text-button" onClick={reset}>
                  New chat
                </button>
              ) : null}
              <button
                type="button"
                className="pl-guide-icon-button"
                aria-label="Close the guide"
                onClick={() => close()}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </header>

          <div ref={listRef} className="pl-guide-list" aria-live="polite">
            {empty ? (
              <div className="pl-guide-empty">
                <div className="pl-guide-suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => ask(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {turns.map((turn, i) => (
              <Fragment key={i}>
                {turn.role === 'user' ? (
                  <p className="pl-guide-question">{turn.content}</p>
                ) : (
                  <div className="pl-guide-answer">
                    <Answer text={turn.content} />
                  </div>
                )}
              </Fragment>
            ))}
            {pending !== null ? (
              <div className="pl-guide-answer" aria-busy="true">
                {pending ? (
                  <Answer text={pending} />
                ) : (
                  <p className="pl-guide-thinking">Reading the docs…</p>
                )}
              </div>
            ) : null}
            {error ? (
              <p className="pl-guide-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <form className="pl-guide-form" onSubmit={onSubmit}>
            <label htmlFor={`${titleId}-input`} className="pl-sr-only">
              Your question
            </label>
            <textarea
              id={`${titleId}-input`}
              ref={inputRef}
              rows={1}
              maxLength={1000}
              value={draft}
              placeholder="Ask about pETH, USDp, Reserve Loans…"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              type="submit"
              className="pl-guide-send"
              aria-label="Send question"
              disabled={!draft.trim() || pending !== null}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                <path
                  d="M12 19V5M5.5 11.5L12 5l6.5 6.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </button>
          </form>
        </section>
      ) : null}
    </>
  )
}
