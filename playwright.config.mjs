import { defineConfig, devices } from '@playwright/test'
import { BASE_PATH } from './app/site-config.mjs'

const playwrightPort = process.env.PLAYWRIGHT_PORT ?? '3100'
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${playwrightPort}`
const webServerURL = `${baseURL}${BASE_PATH || '/'}`
const reuseExport = process.env.PLAYWRIGHT_REUSE_EXPORT === '1'
const webServerCommand = `${reuseExport ? '' : 'npm run build && '}node scripts/serve-export.mjs --port ${playwrightPort}`

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  timeout: 45_000,
  expect: {
    timeout: 10_000
  },
  reporter: [['list']],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry'
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: webServerCommand,
        url: webServerURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000
      },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 }
      }
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5']
      }
    }
  ]
})
