import { expect, test } from '@playwright/test'

async function expectNoDocumentOverflow(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(overflow).toBeLessThanOrEqual(2)
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

test('homepage renders with metadata and basic accessibility', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/Polaris/i)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Polaris/i)
  await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached()
  await expectNoDocumentOverflow(page)
  await expectNoUnnamedVisibleControls(page)
})

test('search opens, returns trove results, and keeps the result panel aligned', async ({
  page
}) => {
  await page.goto('/')

  const input = page.locator('input[type="search"][placeholder*="Search"]:visible').first()
  await input.click()
  await input.fill('trove')

  const results = page.locator('.nextra-search-results')
  await expect(results).toBeVisible()
  await expect(results).toContainText(/trove/i)

  const inputBox = await input.boundingBox()
  const resultsBox = await results.boundingBox()
  expect(inputBox).not.toBeNull()
  expect(resultsBox).not.toBeNull()

  expect(Math.abs(resultsBox.x - inputBox.x)).toBeLessThanOrEqual(2)
  expect(Math.abs(resultsBox.width - inputBox.width)).toBeLessThanOrEqual(2)
})

test('desktop theme menu can switch to light mode', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop-only theme check')

  await page.goto('/')

  await page.locator('button[title="Change theme"]:visible').first().click()
  await page.getByRole('option', { name: /light/i }).click()

  await expect(page.locator('html')).toHaveClass(/light/)
})

test('mobile navigation opens and exposes docs links', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only navigation check')

  await page.goto('/')
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
