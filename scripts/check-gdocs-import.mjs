import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const outDir = path.join(root, 'out')
const failures = []

function walk(dir) {
  const entries = []
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) entries.push(...walk(fullPath))
    else if (entry.endsWith('.html')) entries.push(fullPath)
  }
  return entries
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
}

function textFromHtml(value) {
  return decodeEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

function articleHtml(html) {
  const match = /<article\b[\s\S]*?<\/article>/i.exec(html)
  return match?.[0] ?? ''
}

if (!existsSync(outDir)) {
  console.error('Missing out/ directory. Run npm run build before check:gdocs-import.')
  process.exit(1)
}

for (const file of walk(outDir)) {
  const rel = path.relative(root, file)
  const html = readFileSync(file, 'utf8')
  const article = articleHtml(html)
  if (!article) continue

  const h1Count = (article.match(/<h1\b/gi) ?? []).length
  if (h1Count !== 1) {
    failures.push(`${rel}: expected exactly one article H1, found ${h1Count}`)
  }

  for (const match of article.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = textFromHtml(match[1])
    if (text.length > 520) {
      failures.push(
        `${rel}: rendered paragraph is ${text.length} chars; this often means paragraph breaks collapsed`
      )
    }
  }

  const articleText = textFromHtml(article)
  if (/(^|\s)[A-Z][A-Za-z0-9 &/'-]{1,80}\s+\(\/[a-z0-9][^) \n]*\)/m.test(articleText)) {
    failures.push(`${rel}: rendered article contains a possible flattened route link`)
  }
}

if (failures.length) {
  console.error('Google Docs import regression check failed:\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Google Docs import regression check passed.')
