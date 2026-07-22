import { existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  allNavigationNodes,
  allPageNodes,
  EXTERNAL_LINKS,
  findTrailByRoute,
  FOOTER_GROUPS,
  metaEntriesForDirectory
} from '../app/navigation-config.mjs'
import { hasNavIcon } from '../components/navigation/NavIcon.js'
import { routeForFile, walkMdx } from './lib/content.mjs'

const root = process.cwd()
const contentDir = path.join(root, 'content')
const failures = []

function addFailure(message) {
  failures.push(message)
}

function duplicateValues(values) {
  const seen = new Set()
  const duplicates = new Set()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates]
}

function labelFromMeta(value) {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return ''
  if (value.type === 'separator') return labelFromMeta(value.title)
  const children = value.props?.children
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(labelFromMeta).join('')
  return labelFromMeta(children)
}

async function validateMetadataDirectory(directory) {
  const relative = directory === '/' ? '' : directory.slice(1)
  const metaPath = path.join(contentDir, relative, '_meta.js')
  if (!existsSync(metaPath)) {
    addFailure(`${path.relative(root, metaPath)} is missing`)
    return
  }

  const module = await import(pathToFileURL(metaPath).href)
  const meta = module.default ?? {}
  const expected = metaEntriesForDirectory(directory)
  const actualKeys = Object.keys(meta).filter((key) => key !== '*')
  const expectedKeys = expected.map((entry) => entry.metaKey)

  if (actualKeys.join('|') !== expectedKeys.join('|')) {
    addFailure(
      `${path.relative(root, metaPath)} order mismatch: expected ${expectedKeys.join(', ')}, got ${actualKeys.join(', ')}`
    )
  }

  for (const entry of expected) {
    const value = meta[entry.metaKey]
    if (!value) {
      addFailure(`${path.relative(root, metaPath)} is missing ${entry.metaKey}`)
      continue
    }
    const label = labelFromMeta(value)
    if (label !== entry.label) {
      addFailure(
        `${path.relative(root, metaPath)} ${entry.metaKey} label mismatch: expected "${entry.label}", got "${label}"`
      )
    }
  }
}

const nodes = allNavigationNodes()
const pages = allPageNodes()
const contentRoutes = walkMdx(contentDir)
  .map((file) => routeForFile(contentDir, file))
  .sort()
const configuredRoutes = pages.map((node) => node.route).sort()

for (const duplicate of duplicateValues(nodes.map((node) => node.id))) {
  addFailure(`duplicate navigation id: ${duplicate}`)
}
for (const duplicate of duplicateValues(configuredRoutes)) {
  addFailure(`duplicate page route: ${duplicate}`)
}

for (const route of contentRoutes) {
  if (!configuredRoutes.includes(route)) addFailure(`content route missing from config: ${route}`)
}
for (const route of configuredRoutes) {
  if (!contentRoutes.includes(route)) addFailure(`configured route has no MDX page: ${route}`)
}

for (const node of nodes) {
  if ((node.type === 'page' || node.type === 'folder') && !hasNavIcon(node.icon)) {
    addFailure(`${node.type} ${node.id} has no intentional icon: ${node.icon ?? '(missing)'}`)
  }
  if ((node.type === 'group' || node.type === 'folder') && !node.children?.length) {
    addFailure(`${node.type} ${node.id} has no children`)
  }
}

for (const page of pages) {
  const trail = findTrailByRoute(page.route)
  if (trail.length < 2 || trail[0]?.type !== 'group' || trail.at(-1)?.id !== page.id) {
    addFailure(`route is not reachable through the recursive mobile tree: ${page.route}`)
  }
}

for (const group of FOOTER_GROUPS) {
  for (const link of group.links) {
    if (link.type === 'route' && !configuredRoutes.includes(link.route)) {
      addFailure(`footer route does not exist: ${link.route}`)
    }
    if (link.type === 'external') {
      try {
        new URL(link.href)
      } catch {
        addFailure(`footer external URL is invalid: ${link.href}`)
      }
    }
  }
}

for (const [name, href] of Object.entries(EXTERNAL_LINKS)) {
  try {
    new URL(href)
  } catch {
    addFailure(`external URL ${name} is invalid: ${href}`)
  }
}

await validateMetadataDirectory('/')
for (const node of nodes.filter((entry) => entry.type === 'folder')) {
  await validateMetadataDirectory(node.routePrefix)
}

if (failures.length) {
  console.error('Navigation config validation failed:\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  `Navigation config validation passed (${pages.length} routes, ${nodes.length} nodes, ${FOOTER_GROUPS.length} footer groups).`
)
