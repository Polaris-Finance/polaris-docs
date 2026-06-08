import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { pathWithBase } from '../app/site-config.mjs'

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

      const backgroundFor = (node) => {
        for (let element = node; element; element = element.parentElement) {
          const color = parseRgb(window.getComputedStyle(element).backgroundColor)
          if (color && color.a > 0) return color
        }
        return parseRgb(window.getComputedStyle(document.body).backgroundColor)
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

          const ratio = contrast(foreground, background)
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
        .map((node) => ({
          tag: node.tagName.toLowerCase(),
          text: node.textContent?.trim() ?? '',
          ariaLabel: node.getAttribute('aria-label') ?? '',
          title: node.getAttribute('title') ?? '',
          alt: node.querySelector('img')?.getAttribute('alt') ?? '',
          placeholder: node.getAttribute('placeholder') ?? ''
        }))
        .filter(
          (node) => !node.text && !node.ariaLabel && !node.title && !node.alt && !node.placeholder
        )
    )

  expect(offenders).toEqual([])
}

async function expectTouchTargets(page, selector, label) {
  const offenders = await page.locator(selector).evaluateAll((nodes) =>
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
      .filter(({ width, height }) => width < 44 || height < 44)
  )

  expect(offenders, `${label} below 44px touch target`).toEqual([])
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
      await expectRequiredMetadata(page, route)
      await expectNoDocumentOverflow(page)
      await expectTablesAreCaptionedAndFocusable(page)
    })
  }
})

test('homepage renders with metadata and basic accessibility', async ({ page }) => {
  await page.goto(pathWithBase('/'))

  await expect(page).toHaveTitle(/Polaris/i)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Polaris/i)
  await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached()
  await expectNoDocumentOverflow(page)
  await expectNoUnnamedVisibleControls(page)
})

test('search opens, returns useful results, and keeps the result panel aligned', async ({
  page
}) => {
  await page.goto(pathWithBase('/'))

  const input = page.locator('input[type="search"][placeholder*="Search"]:visible').first()
  await input.click()
  await input.fill('trove')

  const results = page.locator('.nextra-search-results')
  await expect(results).toBeVisible()
  await expect(results).toContainText(/trove/i)
  await expect(results).toContainText(/open|managing/i)

  const inputBox = await input.boundingBox()
  const resultsBox = await results.boundingBox()
  expect(inputBox).not.toBeNull()
  expect(resultsBox).not.toBeNull()

  expect(Math.abs(resultsBox.x - inputBox.x)).toBeLessThanOrEqual(2)
  expect(Math.abs(resultsBox.width - inputBox.width)).toBeLessThanOrEqual(2)

  await input.fill('risk')
  await expect(results).toContainText(/Risk Disclosure/i)
})

test('search snippets avoid hidden vocabulary and table boilerplate', async ({ page }) => {
  await page.goto(pathWithBase('/'))

  const input = page.locator('input[type="search"][placeholder*="Search"]:visible').first()
  await input.click()
  await input.fill('zap')

  const results = page.locator('.nextra-search-results')
  await expect(results).toBeVisible()
  await expect(results).toContainText(/Zap/i)

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

test('sampled article text meets contrast in dark and light themes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop-only contrast sample')

  const routes = ['/', '/resources/glossary', '/resources/brand-assets', '/yield/stability-pool']

  for (const route of routes) {
    await page.goto(pathWithBase(route))
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

  for (const route of ['/resources/contracts', '/stewardship/flows', '/launch-status']) {
    await page.goto(pathWithBase(route), { waitUntil: 'networkidle' })
    await expectNoDocumentOverflow(page)
  }
})

test('dense glossary page stays within the route prefetch budget', async ({ page }) => {
  const routeRequests = new Set()
  page.on('request', (request) => {
    const type = request.resourceType()
    if (!['document', 'fetch', 'xhr'].includes(type)) return

    const url = new URL(request.url())
    const currentOrigin = new URL(page.url() || 'http://127.0.0.1').origin
    if (url.origin !== currentOrigin) return
    if (url.pathname.includes('/_next/') || url.pathname.includes('/_pagefind/')) return
    if (url.pathname === pathWithBase('/resources/glossary')) return

    if (/\/polaris-docs\/.+(?:\.txt|\.html)?$/.test(url.pathname)) {
      routeRequests.add(url.pathname)
    }
  })

  await page.goto(pathWithBase('/resources/glossary'), { waitUntil: 'networkidle' })
  expect([...routeRequests].sort()).toHaveLength(routeRequests.size)
  expect(routeRequests.size).toBeLessThanOrEqual(16)
})

test('docs controls meet 44px touch targets where scoped', async ({ page }, testInfo) => {
  await page.goto(pathWithBase('/'))

  await expectTouchTargets(
    page,
    [
      'header nav a',
      'header nav button',
      'header nav .nextra-search input',
      '.nextra-sidebar a',
      '.nextra-sidebar button',
      '.nextra-sidebar-footer button',
      'article [class*="x:float-end"] button'
    ].join(', '),
    'visible header/sidebar/article controls'
  )

  if (testInfo.project.name === 'mobile') {
    await page
      .getByRole('button', { name: /menu|navigation/i })
      .first()
      .click()
    await expectTouchTargets(
      page,
      '.nextra-mobile-nav a, .nextra-mobile-nav button, .nextra-mobile-nav .nextra-search input',
      'mobile navigation controls'
    )
  }
})

test('mobile navigation opens and exposes docs links', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only navigation check')

  await page.goto(pathWithBase('/'))
  await expectNoDocumentOverflow(page)
  const mobileNav = page.locator('.nextra-mobile-nav')
  await expect(mobileNav).toHaveAttribute('aria-hidden', 'true')
  await expectTabOrderAvoidsHiddenControls(page)

  const menuButton = page.getByRole('button', { name: /menu|navigation/i }).first()
  await menuButton.click()

  await expect(mobileNav).not.toHaveAttribute('aria-hidden', 'true')
  await expect(page.getByRole('link', { name: /Getting Started/i }).first()).toBeVisible()
  await menuButton.click()
  await expect(mobileNav).toHaveAttribute('aria-hidden', 'true')
  await menuButton.focus()
  await expectTabOrderAvoidsHiddenControls(page)
  await expectNoUnnamedVisibleControls(page)
})
