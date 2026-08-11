import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const modifiedCache = new Map()

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

export function fileForRoute(contentDir, route) {
  if (route === '/') return path.join(contentDir, 'index.mdx')

  const relativeRoute = route.replace(/^\//, '')
  const directFile = path.join(contentDir, `${relativeRoute}.mdx`)
  if (existsSync(directFile)) return directFile
  return path.join(contentDir, relativeRoute, 'index.mdx')
}

export function lastModifiedForFile(fullPath, root = process.cwd()) {
  const absolutePath = path.resolve(fullPath)
  if (modifiedCache.has(absolutePath)) return modifiedCache.get(absolutePath)

  let modified = null
  try {
    const relativePath = path.relative(root, absolutePath)
    const value = execFileSync('git', ['log', '-1', '--format=%cI', '--', relativePath], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
    modified = /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1] ?? null
  } catch {
    // A git-less source archive or an untracked page falls back to its file date.
  }

  modified ??= statSync(absolutePath).mtime.toISOString().slice(0, 10)
  modifiedCache.set(absolutePath, modified)
  return modified
}
