import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanRoots = ['content', 'app', 'README.md'].map((entry) => path.join(root, entry))

const files = []

function walk(target) {
  const stat = statSync(target)
  if (stat.isDirectory()) {
    for (const entry of readdirSync(target)) {
      if (entry === 'node_modules' || entry === '.next' || entry === 'out') continue
      walk(path.join(target, entry))
    }
    return
  }

  if (/\.(mdx|md|jsx?|mjs)$/.test(target)) {
    files.push(target)
  }
}

for (const target of scanRoots) {
  walk(target)
}

const failures = []

const forbiddenPatterns = [
  {
    pattern: /\bTODO\b/i,
    message: 'Unresolved TODO marker'
  },
  {
    pattern: /<!--[\s\S]*?-->/,
    message: 'HTML comments are not supported in this MDX setup; use JSX comments only when truly needed'
  },
  {
    pattern: /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/im,
    message: 'GitHub-style admonitions do not render correctly in this Nextra setup'
  },
  {
    pattern: /\bgauge emissions\b/i,
    message: 'Contradicts the Flows/no-emissions model'
  },
  {
    pattern: /\bsnake oil\b/i,
    message: 'Marketing idiom weakens neutral docs/risk tone'
  },
  {
    pattern: /http:\/\/(?!localhost(?::\d+)?(?:\b|\/))/i,
    message: 'Use HTTPS links except for localhost development URLs'
  }
]

for (const file of files) {
  const rel = path.relative(root, file)
  const text = readFileSync(file, 'utf8')
  const isMdx = file.endsWith('.mdx')

  if (isMdx) {
    if (!text.startsWith('---\n')) {
      failures.push(`${rel}: missing frontmatter`)
    } else {
      const end = text.indexOf('\n---', 4)
      const frontmatter = end === -1 ? '' : text.slice(4, end)
      if (!/^title:\s+\S/im.test(frontmatter)) {
        failures.push(`${rel}: frontmatter missing title`)
      }
      if (!/^description:\s+\S/im.test(frontmatter)) {
        failures.push(`${rel}: frontmatter missing description`)
      }
      const descMatch = /^description:\s+(.*)$/im.exec(frontmatter)
      if (descMatch) {
        const description = descMatch[1].trim().replace(/^["']|["']$/g, '')
        if (description.length > 160) {
          failures.push(`${rel}: description is ${description.length} chars (keep ≤160 so search engines don't truncate it)`)
        }
      }
    }
  }

  for (const rule of forbiddenPatterns) {
    if (!isMdx && /HTML comments|GitHub-style/.test(rule.message)) continue
    if (rule.pattern.test(text)) {
      failures.push(`${rel}: ${rule.message}`)
    }
  }
}

if (failures.length) {
  console.error('Content quality check failed:\n')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(`Content quality check passed (${files.length} files scanned).`)
