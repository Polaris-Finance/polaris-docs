import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'

// Shared content-tree helpers for the docs scripts. Recursively collect the
// .mdx pages under a directory and map a file path to its public route.
export function walkMdx(dir) {
  const entries = []
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry)
    if (statSync(fullPath).isDirectory()) {
      entries.push(...walkMdx(fullPath))
    } else if (entry.endsWith('.mdx')) {
      entries.push(fullPath)
    }
  }
  return entries
}

export function routeForFile(contentDir, fullPath) {
  const rel = path.relative(contentDir, fullPath).replace(/\\/g, '/')
  const route = rel.replace(/\.mdx$/, '')
  if (route === 'index') return '/'
  if (route.endsWith('/index')) return `/${route.slice(0, -'/index'.length)}`
  return `/${route}`
}
