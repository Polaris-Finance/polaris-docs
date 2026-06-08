import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { absoluteUrl, BASE_PATH, SITE_BASE_URL } from '../app/site-config.mjs'

const root = process.cwd()
const outDir = path.join(root, 'out')
const failures = []

function walk(dir) {
  const entries = []
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) entries.push(...walk(fullPath))
    else entries.push(fullPath)
  }
  return entries
}

function readOut(relativePath) {
  const fullPath = path.join(outDir, relativePath)
  if (!existsSync(fullPath)) {
    failures.push(`out/${relativePath} is missing`)
    return ''
  }
  return readFileSync(fullPath, 'utf8')
}

if (!existsSync(outDir)) {
  console.error('out/ is missing; run npm run build first')
  process.exit(1)
}

const htmlFiles = walk(outDir).filter((file) => file.endsWith('.html'))
if (!htmlFiles.length) failures.push('out/ contains no HTML files')

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8')
  const relativeFile = path.relative(root, file)

  if (BASE_PATH === '') {
    if (html.includes('/polaris-docs/')) {
      failures.push(`${relativeFile} contains stale /polaris-docs/ references`)
    }
    continue
  }

  const rootScopedAttributes = [...html.matchAll(/\s(?:href|src|action)=["'](\/[^"']*)["']/g)].map(
    (match) => match[1]
  )

  for (const value of rootScopedAttributes) {
    if (value === BASE_PATH || value.startsWith(`${BASE_PATH}/`)) continue
    failures.push(`${relativeFile} contains root-scoped asset or route reference: ${value}`)
  }
}

const sitemap = readOut('sitemap.xml')
const robots = readOut('robots.txt')
const sitemapLocations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])

if (!sitemapLocations.length) {
  failures.push('out/sitemap.xml has no <loc> entries')
}

for (const loc of sitemapLocations) {
  if (!loc.startsWith(SITE_BASE_URL)) {
    failures.push(`out/sitemap.xml location does not match SITE_URL/BASE_PATH: ${loc}`)
  }
  if (BASE_PATH === '' && loc.includes('/polaris-docs/')) {
    failures.push(`out/sitemap.xml contains stale project-page path: ${loc}`)
  }
}

const expectedSitemap = `Sitemap: ${absoluteUrl('/sitemap.xml')}`
if (!robots.includes(expectedSitemap)) {
  failures.push(`out/robots.txt does not include ${expectedSitemap}`)
}

if (failures.length) {
  console.error('Export artifact smoke check failed:\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Export artifact smoke check passed (${htmlFiles.length} HTML files).`)
