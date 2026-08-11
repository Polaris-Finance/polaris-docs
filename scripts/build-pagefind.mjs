import { existsSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { close, createIndex } from 'pagefind'
import { pathWithBase } from '../app/site-config.mjs'
import { kindForPath, sectionForPath } from '../app/search-taxonomy.mjs'
import { searchTermsForPath } from '../app/search-vocabulary.mjs'
import { routeForFile, walkMdx } from './lib/content.mjs'

const root = process.cwd()
const contentDir = path.join(root, 'content')
const outDir = path.join(root, 'out')
const outputDir = path.join(outDir, '_pagefind')
const marker = 'data-polaris-pagefind-only'

function htmlPathForRoute(route) {
  return path.join(outDir, route === '/' ? 'index.html' : `${route.slice(1)}.html`)
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function searchMarkup(route) {
  const section = escapeHtml(sectionForPath(route))
  const kind = escapeHtml(kindForPath(route))
  const { terms, priorityTerms } = searchTermsForPath(route)

  return `<div ${marker}>
<span data-pagefind-meta="section:${section}" data-pagefind-filter="section:${section}"></span>
<span data-pagefind-meta="kind:${kind}"></span>
${priorityTerms.length ? `<span data-pagefind-weight="2">${escapeHtml(priorityTerms.join(' '))}</span>` : ''}
${terms.length ? `<span data-pagefind-weight="0.1">${escapeHtml(terms.join(' '))}</span>` : ''}
</div>`
}

function enrichHtml(html, route) {
  const closingMain = html.lastIndexOf('</main>')
  if (closingMain === -1) throw new Error(`${route} export has no closing main tag`)
  return `${html.slice(0, closingMain)}${searchMarkup(route)}${html.slice(closingMain)}`
}

function failOnErrors(stage, errors = []) {
  if (errors.length) throw new Error(`${stage}:\n${errors.map((error) => `- ${error}`).join('\n')}`)
}

if (!existsSync(outDir)) throw new Error('Static export is missing. Run next build first.')

rmSync(outputDir, { recursive: true, force: true })

const created = await createIndex()
failOnErrors('Could not create Pagefind index', created.errors)
if (!created.index) throw new Error('Pagefind did not return an index')

try {
  const pages = walkMdx(contentDir)
  for (const fullPath of pages) {
    const route = routeForFile(contentDir, fullPath)
    const htmlPath = htmlPathForRoute(route)
    if (!existsSync(htmlPath)) throw new Error(`Missing static HTML for ${route}`)

    const result = await created.index.addHTMLFile({
      url: pathWithBase(route),
      content: enrichHtml(readFileSync(htmlPath, 'utf8'), route)
    })
    failOnErrors(`Could not index ${route}`, result.errors)
  }

  const written = await created.index.writeFiles({ outputPath: outputDir })
  failOnErrors('Could not write Pagefind index', written.errors)
  console.log(`Generated Pagefind index with ${pages.length} pages from in-memory HTML.`)
} finally {
  await close()
}
