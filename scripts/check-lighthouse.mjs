import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { BASE_PATH } from '../app/site-config.mjs'

const root = process.cwd()
const host = '127.0.0.1'
const port = Number(process.env.LIGHTHOUSE_PORT ?? 4174)
const origin = `http://${host}:${port}`
const baseUrl = `${origin}${BASE_PATH}`
const reportDir = mkdtempSync(path.join(os.tmpdir(), 'polaris-lighthouse-'))
const lighthouseBin = path.join(root, 'node_modules', '.bin', 'lighthouse')
const routes = [
  { name: 'home', pathname: '/' },
  { name: 'guide', pathname: '/testnet/guide' }
]
const minimumScores = {
  performance: 0.9,
  accessibility: 1,
  'best-practices': 1,
  seo: 1
}
const failures = []

function routeUrl(pathname) {
  if (pathname === '/') return `${baseUrl || origin}/`
  return `${baseUrl}${pathname}`
}

async function waitForServer(url) {
  const deadline = Date.now() + 20_000
  let lastError = null

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2_000) })
      if (response.ok) return
      lastError = new Error(`${url} returned ${response.status}`)
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  throw new Error(`Timed out waiting for ${url}: ${lastError?.message ?? 'unknown error'}`)
}

function runLighthouse(route) {
  const reportPath = path.join(reportDir, `${route.name}.json`)
  const result = spawnSync(
    lighthouseBin,
    [
      routeUrl(route.pathname),
      '--quiet',
      `--chrome-path=${chromium.executablePath()}`,
      '--chrome-flags=--headless --no-sandbox',
      '--output=json',
      `--output-path=${reportPath}`,
      '--only-categories=performance,accessibility,best-practices,seo'
    ],
    {
      cwd: root,
      encoding: 'utf8',
      env: process.env,
      timeout: 60_000
    }
  )

  if (result.status !== 0) {
    throw new Error(
      `Lighthouse failed for ${route.pathname}: ${result.stderr || result.stdout || 'no output'}`
    )
  }

  return JSON.parse(readFileSync(reportPath, 'utf8'))
}

function checkReport(route, report) {
  const scores = Object.fromEntries(
    Object.entries(minimumScores).map(([category, minimum]) => {
      const score = report.categories?.[category]?.score
      if (typeof score !== 'number' || score < minimum) {
        failures.push(
          `${route.pathname} ${category} score ${score ?? '(missing)'} is below ${minimum}`
        )
      }
      return [category, score]
    })
  )

  const tbt = report.audits?.['total-blocking-time']?.numericValue
  const cls = report.audits?.['cumulative-layout-shift']?.numericValue
  const lcp = report.audits?.['largest-contentful-paint']?.numericValue

  if (typeof tbt !== 'number' || tbt > 200) {
    failures.push(`${route.pathname} TBT ${tbt ?? '(missing)'}ms exceeds 200ms`)
  }
  if (typeof cls !== 'number' || cls > 0.1) {
    failures.push(`${route.pathname} CLS ${cls ?? '(missing)'} exceeds 0.1`)
  }

  console.log(
    `${route.name}: performance ${Math.round(scores.performance * 100)}, SEO ${Math.round(
      scores.seo * 100
    )}, accessibility ${Math.round(scores.accessibility * 100)}, best practices ${Math.round(
      scores['best-practices'] * 100
    )}; LCP ${Math.round(lcp)}ms, TBT ${Math.round(tbt)}ms, CLS ${cls}`
  )
}

function checkRoute(route) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const failureStart = failures.length
    checkReport(route, runLighthouse(route))

    if (failures.length === failureStart) return

    const attemptFailures = failures.splice(failureStart)
    if (attempt === 2) {
      failures.push(...attemptFailures)
      return
    }

    console.warn(`${route.name}: retrying once after a transient Lighthouse threshold failure`)
  }
}

let serverError = ''
const server = spawn(process.execPath, ['scripts/serve-export.mjs', '--port', String(port)], {
  cwd: root,
  env: { ...process.env, HOST: host },
  stdio: ['ignore', 'ignore', 'pipe']
})
server.stderr.on('data', (chunk) => {
  serverError += chunk
})

try {
  await waitForServer(routeUrl('/'))
  for (const route of routes) checkRoute(route)
} catch (error) {
  failures.push(`${error.message}${serverError ? `\n${serverError.trim()}` : ''}`)
} finally {
  server.kill('SIGTERM')
  rmSync(reportDir, { recursive: true, force: true })
}

if (failures.length) {
  console.error('Lighthouse regression check failed:\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Lighthouse regression check passed (${routes.length} routes).`)
