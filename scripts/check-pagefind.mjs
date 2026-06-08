import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []

function validatePagefindDir(directory) {
  const relativeDirectory = path.relative(root, directory)
  const entryPath = path.join(directory, 'pagefind-entry.json')
  const scriptPath = path.join(directory, 'pagefind.js')
  const directoryFailures = []

  if (!existsSync(directory)) {
    failures.push(`${relativeDirectory} is missing; run npm run build first`)
    return
  }

  if (!existsSync(entryPath)) {
    directoryFailures.push(`${relativeDirectory}/pagefind-entry.json is missing`)
  }

  if (!existsSync(scriptPath)) {
    directoryFailures.push(`${relativeDirectory}/pagefind.js is missing`)
  }

  if (directoryFailures.length) {
    failures.push(...directoryFailures)
    return
  }

  const entry = JSON.parse(readFileSync(entryPath, 'utf8'))
  const pageCount = entry.languages?.en?.page_count ?? 0
  const files = readdirSync(directory)
  const hasMeta = files.some((file) => file.endsWith('.pf_meta'))
  const hasWasm = files.some((file) => file.endsWith('.pagefind'))

  if (pageCount < 30) {
    directoryFailures.push(`${relativeDirectory} indexed ${pageCount} pages; expected at least 30`)
  }
  if (!hasMeta) {
    directoryFailures.push(`${relativeDirectory} metadata shard is missing`)
  }
  if (!hasWasm) {
    directoryFailures.push(`${relativeDirectory} WASM artifact is missing`)
  }

  failures.push(...directoryFailures)
}

validatePagefindDir(path.join(root, 'out', '_pagefind'))
validatePagefindDir(path.join(root, 'public', '_pagefind'))

if (failures.length) {
  console.error('Pagefind smoke test failed:\n')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Pagefind smoke test passed.')
