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

rmSync(targetDir, { recursive: true, force: true })
mkdirSync(path.dirname(targetDir), { recursive: true })
cpSync(sourceDir, targetDir, { recursive: true })

console.log('Synced Pagefind index to public/_pagefind for local dev search.')
