import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { allPageNodes, findTrailByRoute } from '../app/navigation-config.mjs'
import { BASE_PATH, pathWithBase } from '../app/site-config.mjs'

const contentDir = path.join(process.cwd(), 'content')

function collectMdxFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return collectMdxFiles(fullPath)
    return entry.isFile() && entry.name.endsWith('.mdx') ? [fullPath] : []
  })
}

function fileToRoute(filePath) {
  const relative = path.relative(contentDir, filePath).replace(/\\/g, '/')
  const withoutExtension = relative.replace(/\.mdx$/, '')
  const route =
    withoutExtension === 'index'
      ? ''
      : withoutExtension.endsWith('/index')
        ? withoutExtension.slice(0, -'/index'.length)
        : withoutExtension

  return route ? `/${route}` : '/'
}

const generatedRoutes = collectMdxFiles(contentDir).map(fileToRoute).sort()
const routeTestName = (route) => (route === '/' ? 'home' : route.slice(1))

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function routeFromHref(href) {
  const pathname = new URL(href, 'http://127.0.0.1').pathname.replace(/\/$/, '') || '/'
  if (BASE_PATH && pathname.startsWith(BASE_PATH)) {
    return pathname.slice(BASE_PATH.length).replace(/\/$/, '') || '/'
  }
  return pathname
}

async function topSearchRoutes(page, count = 2) {
  const hrefs = await page
    .locator('.pl-search-row[data-page="true"]')
    .evaluateAll(
      (links, max) => links.slice(0, max).map((link) => link.getAttribute('href')),
      count
    )
  return hrefs.filter(Boolean).map(routeFromHref)
}

async function openSearch(page) {
  await page.getByRole('button', { name: 'Search documentation' }).click()
  const dialog = page.getByRole('dialog', { name: 'Search Polaris documentation' })
  await expect(dialog).toBeVisible()
  const input = dialog.getByRole('combobox', { name: 'Search the documentation' })
  await expect(input).toBeFocused()
  return { dialog, input }
}

async function openMobileMenu(page) {
  await page.getByRole('button', { name: 'Open navigation' }).click()
  const dialog = page.locator('.pl-docs-overlay--menu')
  await expect(dialog).toBeVisible()
  return dialog
}

async function revealMobileRoute(page, route, activation = 'click') {
  const trail = findTrailByRoute(route)
  expect(trail.length, `${route} is represented in the generated navigation`).toBeGreaterThan(1)
  const pageNode = trail.at(-1)
  const dialog = await openMobileMenu(page)

  for (const branch of trail.slice(0, -1)) {
    if (activation === 'keyboard') {
      await expect(dialog.locator('.pl-mobile-nav-row:focus')).toHaveCount(1)
    }
    const button = dialog.getByRole('button', {
      name: new RegExp(`^${escapeRegExp(branch.label)}(?:\\s*Current section)?$`)
    })
    if (activation === 'keyboard') {
      await button.focus()
      await button.press('Enter')
    } else {
      await button.click()
    }
  }

  await expect(dialog.locator('.pl-mobile-nav-row:focus')).toHaveCount(1)
  const link = dialog.getByRole('link', { name: pageNode.label, exact: true })
  await expect(link).toHaveAttribute('href', pathWithBase(route))
  return { dialog, link }
}

async function expectNoDocumentOverflow(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(overflow).toBeLessThanOrEqual(2)
}

async function expectReadableArticleContrast(page, label) {
  const issues = await page
    .locator('article :is(p, li, td, th, summary, figcaption)')
    .evaluateAll((nodes) => {
      const parseRgb = (value) => {
        const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/.exec(value)
        if (!match) return null
        return {
          r: Number(match[1]),
          g: Number(match[2]),
          b: Number(match[3]),
          a: match[4] === undefined ? 1 : Number(match[4])
        }
      }

      const channel = (value) => {
        const normalized = value / 255
        return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
      }

      const luminance = ({ r, g, b }) =>
        0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)

      const contrast = (foreground, background) => {
        const lighter = Math.max(luminance(foreground), luminance(background))
        const darker = Math.min(luminance(foreground), luminance(background))
        return (lighter + 0.05) / (darker + 0.05)
      }

      const blend = (foreground, background) => ({
        r: foreground.r * foreground.a + background.r * (1 - foreground.a),
        g: foreground.g * foreground.a + background.g * (1 - foreground.a),
        b: foreground.b * foreground.a + background.b * (1 - foreground.a),
        a: 1
      })

      const backgroundFor = (node) => {
        const layers = []
        for (let element = node; element; element = element.parentElement) {
          const color = parseRgb(window.getComputedStyle(element).backgroundColor)
          if (color && color.a > 0) layers.push(color)
        }

        const opaqueBase = { r: 255, g: 255, b: 255, a: 1 }
        if (layers.length === 0) {
          return parseRgb(window.getComputedStyle(document.body).backgroundColor) ?? opaqueBase
        }

        return layers.reverse().reduce((background, layer) => blend(layer, background), opaqueBase)
      }

      return nodes
        .filter((node) => {
          const rect = node.getBoundingClientRect()
          const style = window.getComputedStyle(node)
          return (
            node.textContent.trim().length > 2 &&
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== 'hidden' &&
            style.display !== 'none'
          )
        })
        .map((node) => {
          const style = window.getComputedStyle(node)
          const foreground = parseRgb(style.color)
          const background = backgroundFor(node)
          if (!foreground || !background) return null

          const visibleForeground = foreground.a < 1 ? blend(foreground, background) : foreground
          const ratio = contrast(visibleForeground, background)
          const fontSize = Number.parseFloat(style.fontSize)
          const fontWeight = Number.parseInt(style.fontWeight, 10)
          const threshold = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700) ? 3 : 4.5

          return {
            text: node.textContent.trim().replace(/\s+/g, ' ').slice(0, 80),
            ratio: Math.round(ratio * 100) / 100,
            threshold
          }
        })
        .filter(Boolean)
        .filter(({ ratio, threshold }) => ratio < threshold)
        .slice(0, 10)
    })

  expect(issues, `${label} article text contrast`).toEqual([])
}

async function expectRequiredMetadata(page, route) {
  await expect(page).toHaveTitle(/Polaris/i)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https?:\/\/.+/)

  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
  const canonicalPath = new URL(canonical).pathname.replace(/\/$/, '') || '/'
  const expectedPath = pathWithBase(route).replace(/\/$/, '') || '/'
  expect(canonicalPath).toBe(expectedPath)
}

async function expectTablesAreCaptionedAndFocusable(page) {
  const issues = await page.locator('article table').evaluateAll((tables) =>
    tables.flatMap((table, index) => {
      const tableIssues = []
      const caption = table.querySelector('caption')?.textContent?.trim() ?? ''
      const headers = Array.from(table.querySelectorAll('thead th')).map((header) =>
        header.textContent.trim()
      )

      if (!caption) tableIssues.push(`table ${index + 1} has no caption`)
      if (Number.parseInt(table.getAttribute('tabindex') ?? '-1', 10) < 0) {
        tableIssues.push(`table ${index + 1} is not keyboard-focusable`)
      }
      if (headers.some((header) => !header)) {
        tableIssues.push(`table ${index + 1} has an empty column header`)
      }

      return tableIssues
    })
  )

  expect(issues).toEqual([])

  const firstTable = page.locator('article table').first()
  if ((await firstTable.count()) > 0) {
    await firstTable.focus()
    await expect(firstTable).toBeFocused()
  }
}

async function expectNoUnnamedVisibleControls(page) {
  await page.waitForFunction(() =>
    Array.from(
      document.querySelectorAll('button[aria-haspopup="listbox"]:not([aria-label]):not([title])')
    ).every((button) => !button.parentElement?.textContent?.includes('Copy page'))
  )

  const offenders = await page
    .locator('button, a[href], input, select, textarea')
    .evaluateAll((nodes) =>
      nodes
        .filter((node) => {
          const style = window.getComputedStyle(node)
          const rect = node.getBoundingClientRect()
          return (
            style.visibility !== 'hidden' &&
            style.display !== 'none' &&
            rect.width > 0 &&
            rect.height > 0 &&
            !node.disabled &&
            node.getAttribute('aria-disabled') !== 'true' &&
            !node.closest('[aria-hidden="true"]')
          )
        })
        .map((node) => {
          // Resolve the accessible name the way the a11y tree does: own text,
          // aria-label/labelledby, title, child img alt, placeholder, and an
          // associated <label> (via aria-labelledby, label[for], or wrapping).
          const labelledby = node.getAttribute('aria-labelledby')
          let label = labelledby
            ? labelledby
                .split(/\s+/)
                .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
                .join(' ')
                .trim()
            : ''
          if (!label && node.id) {
            label =
              document.querySelector(`label[for="${CSS.escape(node.id)}"]`)?.textContent?.trim() ??
              ''
          }
          if (!label) label = node.closest('label')?.textContent?.trim() ?? ''
          return {
            tag: node.tagName.toLowerCase(),
            text: node.textContent?.trim() ?? '',
            ariaLabel: node.getAttribute('aria-label') ?? '',
            title: node.getAttribute('title') ?? '',
            alt: node.querySelector('img')?.getAttribute('alt') ?? '',
            placeholder: node.getAttribute('placeholder') ?? '',
            label
          }
        })
        .filter(
          (node) =>
            !node.text &&
            !node.ariaLabel &&
            !node.title &&
            !node.alt &&
            !node.placeholder &&
            !node.label
        )
    )

  expect(offenders).toEqual([])
}

async function expectTouchTargets(page, selector, label, floor = 44) {
  const offenders = await page.locator(selector).evaluateAll(
    (nodes, minSize) =>
      nodes
        .filter((node) => {
          const style = window.getComputedStyle(node)
          const rect = node.getBoundingClientRect()
          return (
            style.visibility !== 'hidden' &&
            style.display !== 'none' &&
            rect.width > 0 &&
            rect.height > 0 &&
            !node.disabled &&
            node.getAttribute('aria-disabled') !== 'true' &&
            !node.closest('[aria-hidden="true"], [inert]')
          )
        })
        .map((node) => {
          const rect = node.getBoundingClientRect()
          return {
            name:
              node.getAttribute('aria-label') ||
              node.getAttribute('title') ||
              node.textContent.trim() ||
              node.tagName.toLowerCase(),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          }
        })
        .filter(({ width, height }) => width < minSize || height < minSize),
    floor
  )

  expect(offenders, `${label} below ${floor}px target`).toEqual([])
}

async function expectTabOrderAvoidsHiddenControls(page, steps = 12) {
  for (let i = 0; i < steps; i += 1) {
    await page.keyboard.press('Tab')

    const activeElement = await page.evaluate(() => {
      const element = document.activeElement
      if (!element || element === document.body) return { visible: true, label: 'body' }

      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      const label =
        element.getAttribute('aria-label') ||
        element.getAttribute('title') ||
        element.textContent?.trim() ||
        element.tagName.toLowerCase()

      return {
        label,
        visible:
          style.visibility !== 'hidden' &&
          style.display !== 'none' &&
          rect.width > 0 &&
          rect.height > 0 &&
          rect.bottom > 0 &&
          rect.right > 0 &&
          rect.top < window.innerHeight &&
          rect.left < window.innerWidth &&
          !element.closest('[aria-hidden="true"]')
      }
    })

    expect(activeElement, `Focused hidden/offscreen control: ${activeElement.label}`).toMatchObject(
      {
        visible: true
      }
    )
  }
}

test.describe('generated route smoke', () => {
  for (const route of generatedRoutes) {
    test(`${routeTestName(route)} loads without regressions`, async ({ page }) => {
      const notFoundResponses = []
      page.on('response', (response) => {
        if (response.status() === 404) notFoundResponses.push(response.url())
      })

      const pageErrors = []
      page.on('pageerror', (error) => pageErrors.push(error))

      await page.goto(pathWithBase(route), { waitUntil: 'networkidle' })

      const sameOriginNotFound = notFoundResponses.filter((url) => {
        try {
          return new URL(url).origin === new URL(page.url()).origin
        } catch {
          return true
        }
      })

      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
      expect(sameOriginNotFound).toEqual([])
      expect(pageErrors).toEqual([])
      await expectRequiredMetadata(page, route)
      await expectNoDocumentOverflow(page)
      await expectNoUnnamedVisibleControls(page)
      await expectTablesAreCaptionedAndFocusable(page)
    })
  }
})

test('unknown routes serve the recovery 404 and legacy routes redirect', async ({ page }) => {
  await page.goto(pathWithBase('/this-page-does-not-exist'))
  await expect(page).toHaveTitle(/Page not found/i)
  await expect(page.getByRole('link', { name: /home page/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Search documentation' })).toBeVisible()
  await expect(page.getByRole('contentinfo', { name: 'Footer' })).toBeVisible()
  await expect(page.locator('main')).toHaveCount(1)

  // A route deleted by the July 2026 rewrite recovers via the 404 redirect
  // map, preserving the fragment across the hop.
  await page.goto(`${pathWithBase('/using-app/issue')}#fees`)
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(pathWithBase('/testnet/mint'))}/?#fees$`))
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()

  // A page merged away by the July 2026 feedback pass redirects to its new home.
  await page.goto(pathWithBase('/architecture/steward-responsibilities'))
  await expect(page).toHaveURL(
    new RegExp(`${escapeRegExp(pathWithBase('/architecture/stewardship'))}/?$`)
  )
})

test('page chrome removals hold: no breadcrumbs, no TOC panel', async ({ page }) => {
  // Owner decision (July 2026 feedback pass): visible breadcrumbs and the
  // "On this page" panel are disabled site-wide via the content/_meta.js
  // wildcard theme. JSON-LD breadcrumbs stay (crawler-facing only).
  await page.goto(pathWithBase('/risks/security-properties'))
  await expect(page.locator('.nextra-breadcrumb')).toHaveCount(0)
  // toc: false empties the panel but the theme keeps the aside shell in the
  // DOM; globals.css hides it.
  await expect(page.locator('.nextra-toc')).toBeHidden()
  await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached()
})

test('prev/next pagination follows the sidebar order', async ({ page }) => {
  // core-assets/_meta.js orders … usdp, goldp, polar …; the footer pagination
  // anchors carry the neighbor title.
  await page.goto(pathWithBase('/core-assets/goldp'))
  await expect(
    page.locator(`a[title="USDp"][href="${pathWithBase('/core-assets/usdp')}"]`)
  ).toBeVisible()
  await expect(
    page.locator(`a[title="POLAR"][href="${pathWithBase('/core-assets/polar')}"]`)
  ).toBeVisible()
})

test('homepage renders with metadata and basic accessibility', async ({ page }) => {
  await page.goto(pathWithBase('/'))

  await expect(page).toHaveTitle(/Polaris/i)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Introduction/i)
  await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached()
  await expectNoDocumentOverflow(page)
  await expectNoUnnamedVisibleControls(page)
})

test('search opens, returns useful results, and fits its surface', async ({ page }, testInfo) => {
  await page.goto(pathWithBase('/'))

  const { dialog, input } = await openSearch(page)
  await input.fill('trove')

  const results = dialog.getByRole('listbox', { name: 'Search results' })
  await expect(results).toBeVisible()
  await expect(results).toContainText(/Mint/i)
  await expect(results).toContainText(/Using Polaris Testnet/i)
  await expect(dialog.locator('.pl-search-count')).toContainText(/Top \d+ of \d+|\d+ shown/)
  await expect(input).toHaveAttribute('aria-autocomplete', 'list')
  await expect(input).toHaveAttribute('aria-expanded', 'true')
  await expect(input).toHaveAttribute('aria-controls', /.+-listbox$/)

  await input.fill('pETH')
  const filter = dialog.getByRole('button', {
    name: 'Filter search results by section: All sections'
  })
  await expect(filter).toBeVisible()
  await filter.click()
  const sectionChip = page.getByRole('button', { name: /Core Assets/ }).last()
  await sectionChip.click()
  await expect(dialog.locator('.pl-search-filter-button')).toContainText('Core Assets')
  await expect(dialog.locator('.pl-search-count')).toContainText(/in Core Assets/)

  const inputBox = await input.boundingBox()
  const surface = dialog.locator(
    testInfo.project.name === 'mobile' ? '.pl-search-dialog' : '.pl-docs-overlay-panel'
  )
  const resultsBox = await surface.boundingBox()
  expect(inputBox).not.toBeNull()
  expect(resultsBox).not.toBeNull()

  if (testInfo.project.name === 'mobile') {
    // Mobile search uses the full content area below the persistent navbar.
    const viewport = page.viewportSize()
    expect(Math.abs(resultsBox.width - viewport.width)).toBeLessThanOrEqual(2)
    expect(resultsBox.x).toBeLessThanOrEqual(2)
    expect(resultsBox.y).toBeGreaterThanOrEqual(68)
    expect(resultsBox.y + resultsBox.height).toBeLessThanOrEqual(viewport.height + 2)
  } else {
    // Desktop search stays centered and compact enough for rapid scanning.
    const viewport = page.viewportSize()
    expect(resultsBox.width).toBeLessThanOrEqual(642)
    expect(Math.abs(resultsBox.x - (viewport.width - resultsBox.width) / 2)).toBeLessThanOrEqual(2)
    expect(resultsBox.y).toBeGreaterThanOrEqual(90)
  }

  await input.fill('risk')
  await expect(results).toContainText(/Risks/i)
  await input.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: 'Search documentation' })).toBeFocused()
})

test('search keyboard, clear, and empty-state refinements work', async ({ page }) => {
  await page.goto(pathWithBase('/'))

  let { dialog, input } = await openSearch(page)
  await input.fill('trove')

  let results = dialog.getByRole('listbox', { name: 'Search results' })
  await expect(results).toBeVisible()
  const firstHref = await results
    .locator('.pl-search-row[data-page="true"]')
    .first()
    .getAttribute('href')
  expect(firstHref).toBeTruthy()

  await input.press('ArrowDown')
  await expect(input).toHaveAttribute('aria-activedescendant', /-item-\d+$/)
  await input.press('Enter')
  const expectedPath = new URL(firstHref, page.url()).pathname
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(expectedPath)}(?:#.*)?$`))
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeFocused()

  await page.keyboard.press('/')
  dialog = page.getByRole('dialog', { name: 'Search Polaris documentation' })
  input = dialog.getByRole('combobox', { name: 'Search the documentation' })
  results = dialog.getByRole('listbox', { name: 'Search results' })
  await expect(input).toBeFocused()
  await input.fill('risk')
  await expect(dialog.getByRole('button', { name: /clear search/i })).toBeVisible()
  await dialog.getByRole('button', { name: /clear search/i }).click()
  await expect(input).toHaveValue('')
  await expect(results).toContainText(/Start here/i)

  await input.fill('liquidaton')
  await expect(results).toContainText(/Search for .liquidation./i)
  await results.getByRole('option', { name: /search for .liquidation./i }).click()
  await expect(input).toHaveValue('liquidation')
  await expect(results).toContainText(/Liquidations/i)

  await input.fill('xqzvnotfound')
  await expect(dialog).toContainText(/No matches/i)
  await expect(results).toContainText(/Try instead/i)
  await expect(results).toContainText(/Risks/i)

  await input.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeFocused()
})

test('search ranking favors direct destinations for high-intent queries', async ({ page }) => {
  await page.goto(pathWithBase('/'))

  const { input } = await openSearch(page)
  const cases = [
    { query: 'POLAR', expectedTopTwo: ['/core-assets/polar', '/architecture/tokenomics'] },
    { query: 'pETH', expectedTopTwo: ['/core-assets/peth'] },
    { query: 'liquidation', expectedTopTwo: ['/design/liquidations'] },
    { query: 'trove', expectedTopTwo: ['/testnet/mint'] },
    { query: 'risk', expectedTopTwo: ['/risks'] }
  ]
  for (const { query, expectedTopTwo } of cases) {
    await input.fill(query)
    await expect
      .poll(
        async () => {
          const routes = await topSearchRoutes(page, 2)
          return routes.some((route) => expectedTopTwo.includes(route))
        },
        { message: `${query} should surface ${expectedTopTwo.join(' or ')} in the top two results` }
      )
      .toBe(true)
  }
})

test('search snippets avoid hidden vocabulary and table boilerplate', async ({ page }) => {
  await page.goto(pathWithBase('/'))

  const { dialog, input } = await openSearch(page)
  await input.fill('split')

  const results = dialog.getByRole('listbox', { name: 'Search results' })
  await expect(results).toBeVisible()
  await expect(results).toContainText(/Split/i)

  const text = (await results.textContent()) ?? ''
  expect(text).not.toMatch(/Search vocabulary|Table columns|Skip to content/i)
})

test('desktop theme menu can switch to light mode', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop-only theme check')

  await page.goto(pathWithBase('/'))

  await page.locator('button[title="Change theme"]:visible').first().click()
  await page.getByRole('option', { name: /light/i }).click()

  await expect(page.locator('html')).toHaveClass(/light/)
})

test('mobile menu theme control can switch to light mode', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only theme check')

  await page.goto(pathWithBase('/'))
  const dialog = await openMobileMenu(page)

  await dialog.locator('button[title="Change theme"]').click()
  await page.getByRole('option', { name: /light/i }).click()

  await expect(page.locator('html')).toHaveClass(/light/)
  await expect(dialog).toBeVisible()
})

test('sampled article text meets contrast in dark and light themes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop-only contrast sample')

  const routes = [
    '/',
    '/core-assets/peth',
    '/architecture/flows',
    '/design/interest-rates',
    '/testnet/mint',
    '/risks'
  ]

  for (const route of routes) {
    await page.goto(pathWithBase(route))
    await page.locator('button[title="Change theme"]:visible').first().click()
    await page.getByRole('option', { name: /dark/i }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expectReadableArticleContrast(page, `${route} dark`)

    await page.locator('button[title="Change theme"]:visible').first().click()
    await page.getByRole('option', { name: /light/i }).click()
    await expect(page.locator('html')).toHaveClass(/light/)
    await expectReadableArticleContrast(page, `${route} light`)
  }
})

test('print media keeps wide reference pages within the viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop-only print/PDF check')

  await page.emulateMedia({ media: 'print' })

  for (const route of [
    '/architecture/tokenomics',
    '/architecture/passet-markets',
    '/design/oracles',
    '/core-assets/fpeth',
    '/risks'
  ]) {
    await page.goto(pathWithBase(route), { waitUntil: 'networkidle' })
    await expectNoDocumentOverflow(page)
    await expect(page.locator('header')).toBeHidden()
    await expect(page.locator('.nextra-sidebar')).toBeHidden()
    await expect(page.getByRole('contentinfo', { name: 'Footer' })).toBeHidden()
  }
})

test('dense article page stays within the route prefetch budget', async ({ page }) => {
  const routeRequests = new Set()
  page.on('request', (request) => {
    const type = request.resourceType()
    if (!['document', 'fetch', 'xhr'].includes(type)) return

    const url = new URL(request.url())
    const currentOrigin = new URL(page.url() || 'http://127.0.0.1').origin
    if (url.origin !== currentOrigin) return
    if (url.pathname.includes('/_next/') || url.pathname.includes('/_pagefind/')) return
    if (url.pathname === pathWithBase('/risks')) return

    if (/\/polaris-docs\/.+(?:\.txt|\.html)?$/.test(url.pathname)) {
      routeRequests.add(url.pathname)
    }
  })

  await page.goto(pathWithBase('/risks'), { waitUntil: 'networkidle' })
  expect([...routeRequests].sort()).toHaveLength(routeRequests.size)
  expect(routeRequests.size).toBeLessThanOrEqual(16)
})

test('docs controls meet 44px touch targets where scoped', async ({ page }, testInfo) => {
  await page.goto(pathWithBase('/'))

  await expectTouchTargets(
    page,
    ['header nav a', 'header nav button'].join(', '),
    'visible header controls',
    testInfo.project.name === 'mobile' ? 44 : 24
  )

  // Sidebar rows are compact on fine pointers (owner-approved density, Aave
  // plan A4) but must keep the 44px target on touch devices; 24px is the
  // WCAG 2.5.8 pointer floor the compact rows still have to clear.
  await expectTouchTargets(
    page,
    ['.nextra-sidebar a', '.nextra-sidebar button', '.nextra-sidebar-footer button'].join(', '),
    'visible sidebar controls',
    testInfo.project.name === 'mobile' ? 44 : 24
  )

  if (testInfo.project.name === 'mobile') {
    // The Copy page control is compact on fine pointers (owner request) but
    // must keep the 44px target on touch devices.
    await expectTouchTargets(page, 'article [class*="x:float-end"] button', 'article copy controls')
    await openMobileMenu(page)
    await expectTouchTargets(
      page,
      '.pl-mobile-nav-body a, .pl-mobile-nav-body button, .pl-mobile-nav-utilities a, .pl-mobile-nav-utilities button',
      'mobile navigation controls'
    )
  }
})

test('mobile navigation is recursive, keyboard operable, and mutually exclusive with search', async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only navigation check')

  await page.goto(pathWithBase('/design/interest-rates'))
  await expectNoDocumentOverflow(page)
  await expect(page.locator('.nextra-mobile-nav')).toBeHidden()
  await expect(page.locator('.nextra-hamburger')).toBeHidden()
  await expectTabOrderAvoidsHiddenControls(page)

  const dialog = await openMobileMenu(page)
  await expect(dialog.getByText('Documentation', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: /^Protocol.*Current section/ })).toBeFocused()
  const protocolButton = dialog.getByRole('button', { name: /^Protocol/ })
  await protocolButton.focus()
  await protocolButton.press('Enter')
  await expect(dialog.getByRole('button', { name: /^Protocol Mechanics/ })).toBeFocused()
  const mechanicsButton = dialog.getByRole('button', { name: /^Protocol Mechanics/ })
  await mechanicsButton.focus()
  await mechanicsButton.press('Enter')
  await expect(dialog.getByRole('link', { name: 'Interest Rates' })).toHaveAttribute(
    'aria-current',
    'page'
  )
  await dialog.getByRole('button', { name: 'Back to Protocol' }).click()
  await expect(dialog.getByRole('button', { name: /^Protocol Mechanics/ })).toBeVisible()
  await dialog.getByRole('button', { name: 'Back to Documentation' }).click()
  await expect(dialog.getByRole('button', { name: /^Protocol/ })).toBeVisible()

  await page.keyboard.press('Control+K')
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('dialog', { name: 'Search Polaris documentation' })).toBeVisible()
  await page.getByRole('button', { name: 'Close search' }).click()
  await expect(page.getByRole('button', { name: 'Search documentation' })).toBeFocused()
  await expectTabOrderAvoidsHiddenControls(page)
  await expectNoUnnamedVisibleControls(page)
})

test('mobile navbar strip does not act as an outside-dismiss scrim', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only overlay boundary check')
  await page.goto(pathWithBase('/'))

  const searchBox = await page.getByRole('button', { name: 'Search documentation' }).boundingBox()
  const menuBox = await page.getByRole('button', { name: 'Open navigation' }).boundingBox()
  expect(searchBox).not.toBeNull()
  expect(menuBox).not.toBeNull()

  const menuDialog = await openMobileMenu(page)
  await page.mouse.click(searchBox.x + searchBox.width / 2, searchBox.y + searchBox.height / 2)
  await expect(menuDialog).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Search Polaris documentation' })).toBeHidden()
  await expect(page.locator('.pl-navbar-actions')).toHaveCSS('opacity', '0.42')
  await menuDialog.getByRole('button', { name: 'Close navigation' }).click()

  const { dialog: searchDialog } = await openSearch(page)
  await page.mouse.click(menuBox.x + menuBox.width / 2, menuBox.y + menuBox.height / 2)
  await expect(searchDialog).toBeVisible()
  await expect(page.locator('.pl-docs-overlay--menu')).toBeHidden()
})

test('mobile navigation reveals the current leaf on a short viewport', async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only current-location check')
  await page.setViewportSize({ width: 390, height: 568 })
  await page.goto(pathWithBase('/testnet/analytics'))

  const dialog = await openMobileMenu(page)
  await dialog.getByRole('button', { name: /^Use Polaris/ }).click()
  await dialog.getByRole('button', { name: /^Using Polaris Testnet/ }).click()

  const current = dialog.getByRole('link', { name: 'Analytics', exact: true })
  await expect(current).toBeFocused()
  await expect(current).toHaveAttribute('aria-current', 'page')
  await expect
    .poll(() =>
      current.evaluate((element) => {
        const row = element.getBoundingClientRect()
        const body = element.closest('.pl-mobile-nav-body')?.getBoundingClientRect()
        return Boolean(body && row.top >= body.top - 1 && row.bottom <= body.bottom + 1)
      })
    )
    .toBe(true)
})

test('every configured docs page is reachable in the mobile menu by touch and keyboard', async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only generated reachability check')
  test.setTimeout(180_000)
  await page.goto(pathWithBase('/'))

  for (const node of allPageNodes()) {
    const keyboard = await revealMobileRoute(page, node.route, 'keyboard')
    await keyboard.link.focus()
    await expect(keyboard.link).toBeFocused()
    await keyboard.dialog.getByRole('button', { name: 'Close navigation' }).click()

    const touch = await revealMobileRoute(page, node.route, 'click')
    await touch.link.click()
    await expect(touch.dialog).toBeHidden()
    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(pathWithBase(node.route))}/?(?:#.*)?$`))
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeFocused()
  }
})

test('desktop navigation exposes icons, hierarchy state, and a single current page', async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop-only navigation semantics check')
  await page.goto(pathWithBase('/design/liquidations'))

  const sidebar = page.getByRole('navigation', { name: 'Documentation' })
  await expect(sidebar).toBeVisible()
  const current = sidebar.getByRole('link', { name: 'Liquidations', exact: true })
  await expect(current).toHaveAttribute('aria-current', 'page')
  await expect(sidebar.locator('a[aria-current="page"]')).toHaveCount(1)
  await expect(current.locator('.pl-nav-icon')).toBeVisible()

  const mechanics = sidebar.getByRole('button', { name: /Protocol Mechanics/ })
  await expect(mechanics).toHaveAttribute('aria-expanded', 'true')
  await expect(mechanics).toHaveAttribute('aria-controls', /pl-sidebar-folder-/)
  await mechanics.click()
  await expect(mechanics).toHaveAttribute('aria-expanded', 'false')
  await mechanics.focus()
  await mechanics.press('Enter')
  await expect(mechanics).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('main .pl-nav-icon')).toBeHidden()
})

test('footer is complete, route-aware, and uses correct external-link semantics', async ({
  page
}) => {
  await page.goto(pathWithBase('/core-assets/peth'))

  const footer = page.getByRole('contentinfo', { name: 'Footer' })
  await expect(footer).toBeVisible()
  for (const heading of ['Learn', 'Protocol', 'Use Polaris', 'Resources']) {
    await expect(footer.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  }
  await expect(footer.getByRole('link', { name: 'pETH', exact: true })).toHaveAttribute(
    'aria-current',
    'page'
  )
  await expect(footer.getByRole('link', { name: 'llms.txt', exact: true })).toHaveAttribute(
    'href',
    pathWithBase('/llms.txt')
  )
  const website = footer.getByRole('link', { name: /Website,? opens in a new tab/i })
  await expect(website).toHaveAttribute('href', 'https://polarisfinance.io')
  await expect(website).toHaveAttribute('target', '_blank')
})

test('shell switches exactly at the 767/768 breakpoint across representative viewports', async ({
  browser
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one responsive matrix run is sufficient')
  test.setTimeout(90_000)
  const viewports = [
    { width: 320, height: 568 },
    { width: 360, height: 800 },
    { width: 568, height: 320 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 430, height: 932 },
    { width: 767, height: 1024 },
    { width: 768, height: 1024 },
    { width: 1024, height: 900 },
    { width: 1440, height: 900 },
    { width: 1440, height: 1000 },
    { width: 1920, height: 1080 }
  ]

  for (const viewport of viewports) {
    const candidate = await browser.newPage({ viewport })
    await candidate.goto(pathWithBase('/design/liquidations'))
    await expectNoDocumentOverflow(candidate)

    const mobile = viewport.width <= 767
    if (mobile) {
      await expect(candidate.getByRole('button', { name: 'Open navigation' })).toBeVisible()
      await expect(candidate.locator('.nextra-sidebar')).toBeHidden()
      await expect(candidate.locator('.nextra-hamburger')).toBeHidden()
    } else {
      await expect(candidate.getByRole('button', { name: 'Open navigation' })).toBeHidden()
      await expect(candidate.getByRole('navigation', { name: 'Documentation' })).toBeVisible()
    }
    await candidate.close()
  }
})

test('forced-colors mode preserves visible keyboard focus', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop-only forced-colors check')
  await page.emulateMedia({ forcedColors: 'active' })
  await page.goto(pathWithBase('/'))

  const search = page.getByRole('button', { name: 'Search documentation' })
  await search.focus()
  const focusStyle = await search.evaluate((element) => {
    const style = window.getComputedStyle(element)
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth }
  })
  expect(focusStyle.outlineStyle).not.toBe('none')
  expect(Number.parseFloat(focusStyle.outlineWidth)).toBeGreaterThan(0)
  await expectNoDocumentOverflow(page)
})

test('skip link and modal focus containment preserve keyboard orientation', async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop-only keyboard shell check')
  await page.goto(pathWithBase('/design/interest-rates'))

  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to Content' })
  await expect(skip).toBeFocused()
  await skip.press('Enter')
  await expect(page.locator('main')).toBeFocused()

  const { dialog } = await openSearch(page)
  expect(
    await page.evaluate(() => document.querySelector('main')?.closest('[inert]') !== null)
  ).toBe(true)
  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press(step % 4 === 0 ? 'Shift+Tab' : 'Tab')
    expect(
      await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))
    ).toBe(true)
  }

  await page.locator('.pl-docs-overlay-backdrop').click({ position: { x: 5, y: 5 } })
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: 'Search documentation' })).toBeFocused()
})

test('search ignores global shortcuts in editable fields and clears local recent history', async ({
  page
}) => {
  await page.goto(pathWithBase('/'))
  await page.evaluate(() =>
    window.localStorage.setItem(
      'polaris-docs:recent-searches',
      JSON.stringify(['liquidation', 'pETH'])
    )
  )

  const { dialog, input } = await openSearch(page)
  await expect(dialog.getByText('Recent', { exact: true })).toBeVisible()
  const clearRecent = dialog.getByRole('button', { name: 'Clear recent searches' })
  const listbox = dialog.getByRole('listbox', { name: 'Search results' })
  expect(
    await clearRecent.evaluate((element) => element.closest('[role="listbox"]') === null)
  ).toBe(true)
  await expect(listbox.locator(':is(button, a):not([role="option"])')).toHaveCount(0)
  expect(
    await listbox
      .getByRole('option')
      .evaluateAll((options) => options.every((option) => option.getAttribute('tabindex') === '-1'))
  ).toBe(true)
  await expect(clearRecent).not.toHaveAttribute('role', 'option')
  await expect(clearRecent).not.toHaveAttribute('tabindex', '-1')
  await clearRecent.click()
  await expect(dialog.getByText('Recent', { exact: true })).toBeHidden()

  await input.fill('risk')
  await page.keyboard.press('Control+K')
  await expect(dialog).toBeVisible()
  await expect(input).toHaveValue('risk')
  await input.press('/')
  await expect(input).toHaveValue('risk/')
  await expect(page.getByRole('dialog')).toHaveCount(1)
})

test('same-page search navigation focuses the selected heading', async ({ page }) => {
  await page.goto(pathWithBase('/design/interest-rates'))
  const { dialog, input } = await openSearch(page)
  await input.fill('Peg Stability Rate')

  const destination = dialog.locator(
    `.pl-search-row[href="${pathWithBase('/design/interest-rates')}#peg-stability-rate"]`
  )
  await expect(destination).toBeVisible()
  await destination.click()
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/#peg-stability-rate$/)
  await expect(page.locator('#peg-stability-rate')).toBeFocused()
})

test('cross-page search navigation focuses and reveals the selected heading', async ({ page }) => {
  await page.goto(pathWithBase('/'))
  const { dialog, input } = await openSearch(page)
  await input.fill('Peg Stability Rate')

  const destination = dialog.locator(
    `.pl-search-row[href="${pathWithBase('/design/interest-rates')}#peg-stability-rate"]`
  )
  await expect(destination).toBeVisible()
  await destination.click()

  await expect(page).toHaveURL(/\/design\/interest-rates\/?#peg-stability-rate$/)
  const target = page.locator('#peg-stability-rate')
  await expect(target).toBeFocused()
  await expect
    .poll(() =>
      target.evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        return bounds.top >= 70 && bounds.top < window.innerHeight
      })
    )
    .toBe(true)
})

test('200 percent text size and 320 CSS-pixel reflow keep shell controls separated', async ({
  browser
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one text-resize matrix run is sufficient')
  for (const viewport of [
    { width: 320, height: 900 },
    { width: 768, height: 1024 }
  ]) {
    const candidate = await browser.newPage({ viewport })
    await candidate.goto(pathWithBase('/design/adaptive-peg-defence'))
    await candidate.addStyleTag({ content: 'html { font-size: 200% !important; }' })
    await expectNoDocumentOverflow(candidate)

    const collisions = await candidate
      .locator('header nav a:visible, header nav button:visible')
      .evaluateAll((controls) =>
        controls.flatMap((control, index) => {
          const a = control.getBoundingClientRect()
          return controls.slice(index + 1).flatMap((other) => {
            const b = other.getBoundingClientRect()
            const overlaps =
              a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
            return overlaps
              ? [
                  `${control.textContent || control.getAttribute('aria-label')} overlaps ${other.textContent || other.getAttribute('aria-label')}`
                ]
              : []
          })
        })
      )
    expect(collisions).toEqual([])

    const headerCollision = await candidate.evaluate(() => {
      const heading = document.querySelector('article h1')?.getBoundingClientRect()
      const copy = document
        .querySelector('article [class*="x:float-end"] button')
        ?.getBoundingClientRect()
      if (!heading || !copy) return false
      return (
        heading.left < copy.right &&
        heading.right > copy.left &&
        heading.top < copy.bottom &&
        heading.bottom > copy.top
      )
    })
    expect(headerCollision).toBe(false)
    await candidate.close()
  }
})

test('mobile overlays follow viewport-height changes without clipping controls', async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only visual viewport check')
  await page.goto(pathWithBase('/'))
  const { dialog, input } = await openSearch(page)
  await page.setViewportSize({ width: 390, height: 420 })

  const bounds = await dialog.locator('.pl-search-dialog').boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds.y).toBeGreaterThanOrEqual(68)
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(422)
  await expect(input).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Close search' })).toBeVisible()
  await expectNoDocumentOverflow(page)
})

test('search filter remains reachable in short landscape viewports', async ({ page }, testInfo) => {
  const viewport =
    testInfo.project.name === 'mobile' ? { width: 568, height: 320 } : { width: 844, height: 390 }
  await page.setViewportSize(viewport)
  await page.goto(pathWithBase('/'))

  const { dialog, input } = await openSearch(page)
  await input.fill('pETH')
  await dialog
    .getByRole('button', { name: 'Filter search results by section: All sections' })
    .click()

  const filterPanel = dialog.locator('.pl-search-filter-panel[aria-label="Filter by section"]')
  const lastSection = filterPanel.locator('button').last()
  const label = (await lastSection.locator('span').first().textContent())?.trim()
  expect(label).toBeTruthy()
  await lastSection.scrollIntoViewIfNeeded()
  const panelBounds = await filterPanel.boundingBox()
  expect(panelBounds).not.toBeNull()
  expect(panelBounds.y + panelBounds.height).toBeLessThanOrEqual(viewport.height + 2)
  const optionBounds = await lastSection.boundingBox()
  expect(optionBounds).not.toBeNull()
  expect(optionBounds.y).toBeGreaterThanOrEqual(panelBounds.y - 1)
  expect(optionBounds.y + optionBounds.height).toBeLessThanOrEqual(
    panelBounds.y + panelBounds.height + 1
  )

  await lastSection.click()
  await expect(dialog.locator('.pl-search-filter-button')).toContainText(label)
})
