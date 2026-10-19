// Ask the guide: Cloudflare Worker behind the docs chat widget.
// Receives { messages, page } from docs.polaris.finance, checks the per-visitor
// limits, sends the question to Claude with the rules and the full docs
// (docs.polaris.finance/llms-full.txt, prompt-cached), streams the answer back as
// plain text and logs the question and answer in D1.

import { RULES } from './rules.js'

const MODEL = 'claude-sonnet-5-5'
const MAX_TOKENS = 1500
const DOCS_URL = 'https://docs.polaris.finance/llms-full.txt'
const DOCS_TTL_MS = 15 * 60 * 1000

const ALLOWED_ORIGINS = ['https://docs.polaris.finance', 'http://localhost:3000']

const LIMIT_PER_DAY = 30
const MAX_QUESTION_CHARS = 1000
const MAX_TURN_CHARS = 6000
const MAX_TURNS = 6

let docsCache = { text: '', at: 0 }

async function getDocs() {
  if (docsCache.text && Date.now() - docsCache.at < DOCS_TTL_MS) return docsCache.text
  const response = await fetch(DOCS_URL, { cf: { cacheTtl: 900 } })
  if (!response.ok) {
    if (docsCache.text) return docsCache.text
    throw new Error(`docs fetch failed: ${response.status}`)
  }
  docsCache = { text: await response.text(), at: Date.now() }
  return docsCache.text
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  }
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders(origin) }
  })
}

async function hashVisitor(ip, salt) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`))
  return [...new Uint8Array(digest)]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Returns null when the conversation is acceptable, otherwise an error code.
function validate(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return 'bad_request'
  if (messages.length > MAX_TURNS) return 'bad_request'
  for (const [i, m] of messages.entries()) {
    if (!m || typeof m.content !== 'string' || !m.content.trim()) return 'bad_request'
    if (m.role !== (i % 2 === 0 ? 'user' : 'assistant')) return 'bad_request'
    if (m.content.length > MAX_TURN_CHARS) return 'too_long'
  }
  const last = messages[messages.length - 1]
  if (last.role !== 'user') return 'bad_request'
  if (last.content.length > MAX_QUESTION_CHARS) return 'too_long'
  return null
}

async function checkLimit(env, visitor) {
  const now = Date.now()
  const row = await env.DB.prepare(
    'SELECT COUNT(*) AS day FROM hits WHERE visitor = ?1 AND ts > ?2'
  )
    .bind(visitor, now - 86_400_000)
    .first()
  if (row.day >= LIMIT_PER_DAY) return false
  await env.DB.prepare('INSERT INTO hits (visitor, ts) VALUES (?1, ?2)').bind(visitor, now).run()
  return true
}

// Reads Anthropic's event stream, forwards only the answer text, and resolves
// with the full answer for logging.
function relayText(upstream, writer) {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const reader = upstream.body.getReader()
  let buffer = ''
  let answer = ''
  let stopReason = ''
  return (async () => {
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          let event
          try {
            event = JSON.parse(line.slice(5))
          } catch {
            continue
          }
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            answer += event.delta.text
            await writer.write(encoder.encode(event.delta.text))
          } else if (event.type === 'message_delta' && event.delta?.stop_reason) {
            stopReason = event.delta.stop_reason
          } else if (event.type === 'error') {
            stopReason = `error:${event.error?.type || 'unknown'}`
          }
        }
      }
    } finally {
      await writer.close().catch(() => {})
    }
    return { answer, stopReason }
  })()
}

async function handleAsk(request, env, ctx, origin) {
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'bad_request' }, 400, origin)
  }
  const messages = body?.messages
  const problem = validate(messages)
  if (problem) return json({ error: problem }, 400, origin)
  const page = typeof body.page === 'string' ? body.page.slice(0, 200) : ''

  const ip = request.headers.get('cf-connecting-ip') || 'unknown'
  const visitor = await hashVisitor(ip, env.VISITOR_SALT || 'polaris')
  if (!(await checkLimit(env, visitor))) return json({ error: 'rate_limited' }, 429, origin)

  let docs
  try {
    docs = await getDocs()
  } catch (err) {
    console.error(err)
    return json({ error: 'unavailable' }, 503, origin)
  }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      stream: true,
      system: [
        { type: 'text', text: RULES },
        {
          type: 'text',
          text: `=== POLARIS DOCUMENTATION (authoritative) ===\n\n${docs}\n=== END OF DOCUMENTATION ===`,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: messages.map(({ role, content }) => ({ role, content: content.trim() }))
    })
  })

  if (!upstream.ok || !upstream.body) {
    console.error('anthropic error', upstream.status, await upstream.text().catch(() => ''))
    return json({ error: 'unavailable' }, 502, origin)
  }

  const { readable, writable } = new TransformStream()
  const done = relayText(upstream, writable.getWriter()).then(({ answer, stopReason }) =>
    env.DB.prepare(
      'INSERT INTO questions (ts, page, question, answer, stop_reason) VALUES (?1, ?2, ?3, ?4, ?5)'
    )
      .bind(Date.now(), page, messages[messages.length - 1].content, answer, stopReason)
      .run()
      .catch((err) => console.error('log failed', err))
  )
  ctx.waitUntil(done)

  return new Response(readable, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      ...corsHeaders(origin)
    }
  })
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('origin') || ''
    if (!ALLOWED_ORIGINS.includes(origin)) return new Response('Forbidden', { status: 403 })
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(origin) })
    if (request.method !== 'POST') return json({ error: 'bad_request' }, 405, origin)
    try {
      return await handleAsk(request, env, ctx, origin)
    } catch (err) {
      console.error(err)
      return json({ error: 'unavailable' }, 500, origin)
    }
  },

  // Daily cleanup: rate-limit rows older than two days are no longer needed.
  async scheduled(event, env) {
    await env.DB.prepare('DELETE FROM hits WHERE ts < ?1')
      .bind(Date.now() - 2 * 86_400_000)
      .run()
  }
}
