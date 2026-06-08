import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { absoluteUrl, BASE_PATH, SITE_BASE_URL, SITE_URL } from '../app/site-config.mjs'

const root = process.cwd()
const failures = []
const expectedHost = new URL(SITE_URL).host
const staleCustomHost = 'docs.polarisfinance.io'

function readIfExists(relativePath) {
  const fullPath = path.join(root, relativePath)
  return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : ''
}

function assertIncludes(relativePath, expected) {
  const text = readIfExists(relativePath)
  if (!text.includes(expected)) {
    failures.push(`${relativePath} does not include ${expected}`)
  }
}

function assertNoStaleHost(relativePath, text) {
  if (text.includes(staleCustomHost) && expectedHost !== staleCustomHost) {
    failures.push(`${relativePath} still references ${staleCustomHost}`)
  }
}

const cnamePath = path.join(root, 'public', 'CNAME')
if (BASE_PATH && existsSync(cnamePath)) {
  failures.push(
    'public/CNAME exists while BASE_PATH is set; project-site mode must not publish CNAME'
  )
} else if (!BASE_PATH && existsSync(cnamePath)) {
  const cname = readIfExists('public/CNAME').trim()
  if (cname !== expectedHost) failures.push(`public/CNAME is ${cname}; expected ${expectedHost}`)
}

assertIncludes('README.md', `SITE_URL=${SITE_URL}`)
assertIncludes('README.md', `BASE_PATH=${BASE_PATH || ''}`)
assertIncludes('.github/workflows/deploy.yml', `SITE_URL: ${SITE_URL}`)
assertIncludes('.github/workflows/deploy.yml', `BASE_PATH: ${BASE_PATH || ''}`)

for (const relativePath of [
  'public/sitemap.xml',
  'public/robots.txt',
  'public/llms.txt',
  'public/llms-full.txt',
  'public/llms-index.json'
]) {
  const text = readIfExists(relativePath)
  if (!text) {
    failures.push(`${relativePath} is missing`)
    continue
  }
  assertNoStaleHost(relativePath, text)
  if (!text.includes(SITE_BASE_URL) && relativePath !== 'public/robots.txt') {
    failures.push(`${relativePath} does not include ${SITE_BASE_URL}`)
  }
}

const robots = readIfExists('public/robots.txt')
if (robots && !robots.includes(`Sitemap: ${absoluteUrl('/sitemap.xml')}`)) {
  failures.push(`public/robots.txt sitemap does not match ${absoluteUrl('/sitemap.xml')}`)
}

if (failures.length) {
  console.error('Host consistency check failed:\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Host consistency check passed (${SITE_BASE_URL}).`)
