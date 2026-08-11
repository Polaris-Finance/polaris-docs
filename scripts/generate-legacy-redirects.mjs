import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { LEGACY_REDIRECTS } from '../app/legacy-redirects.mjs'
import { absoluteUrl } from '../app/site-config.mjs'
import { routeForFile, walkMdx } from './lib/content.mjs'

const root = process.cwd()
const contentDir = path.join(root, 'content')
const outDir = path.join(root, 'out')
const canonicalRoutes = new Set(
  walkMdx(contentDir).map((fullPath) => routeForFile(contentDir, fullPath))
)

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function redirectHtml(targetRoute) {
  const target = absoluteUrl(targetRoute)
  const escapedTarget = escapeHtml(target)

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="0;url=${escapedTarget}">
<link rel="canonical" href="${escapedTarget}">
<title>Redirecting to Polaris Docs</title>
<script>location.replace(${JSON.stringify(target)}+location.search+location.hash)</script>
</head>
<body>
<p>This page has moved to <a href="${escapedTarget}">${escapedTarget}</a>.</p>
</body>
</html>
`
}

if (!existsSync(outDir)) throw new Error('Static export is missing. Run next build first.')

for (const [source, target] of Object.entries(LEGACY_REDIRECTS)) {
  if (canonicalRoutes.has(source)) throw new Error(`Legacy source is still canonical: ${source}`)
  if (!canonicalRoutes.has(target))
    throw new Error(`Legacy target does not exist: ${source} -> ${target}`)
  if (Object.hasOwn(LEGACY_REDIRECTS, target)) {
    throw new Error(`Legacy redirect chain is not allowed: ${source} -> ${target}`)
  }

  const outputPath = path.join(outDir, `${source.slice(1)}.html`)
  mkdirSync(path.dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, redirectHtml(target))
}

console.log(`Generated ${Object.keys(LEGACY_REDIRECTS).length} static legacy redirect pages.`)
