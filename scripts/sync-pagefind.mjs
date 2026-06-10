import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sourceDir = path.join(root, 'out', '_pagefind')
const targetDir = path.join(root, 'public', '_pagefind')
const softFail = process.argv.includes('--if-exists')

function exitWith(message) {
  if (softFail) {
    console.warn(message)
    process.exit(0)
  }

  console.error(message)
  process.exit(1)
}

if (!existsSync(sourceDir)) {
  exitWith('Pagefind index is missing. Run npm run build before testing search in dev.')
}

const requiredFiles = ['pagefind-entry.json', 'pagefind.js']
const missingFiles = requiredFiles.filter((file) => !existsSync(path.join(sourceDir, file)))

if (missingFiles.length) {
  exitWith(`Pagefind index is incomplete: missing ${missingFiles.join(', ')}.`)
}

// PolarisSearch imports only pagefind.js (which loads its worker, wasm, and
// shards itself); the stock Pagefind UI bundles are dead deploy weight.
const unusedUiBundles = [
  'pagefind-ui.js',
  'pagefind-ui.css',
  'pagefind-modular-ui.js',
  'pagefind-modular-ui.css',
  'pagefind-component-ui.js',
  'pagefind-component-ui.css',
  'pagefind-highlight.js'
]
for (const file of unusedUiBundles) {
  rmSync(path.join(sourceDir, file), { force: true })
}

rmSync(targetDir, { recursive: true, force: true })
mkdirSync(path.dirname(targetDir), { recursive: true })
cpSync(sourceDir, targetDir, { recursive: true })

console.log('Synced Pagefind index to public/_pagefind for local dev search.')
