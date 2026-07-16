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
    message:
      'HTML comments are not supported in this MDX setup; use JSX comments only when truly needed'
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
    pattern: /http:\/\/(?!(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\b|\/))/i,
    message: 'Use HTTPS links except for localhost or loopback development URLs'
  },
  {
    pattern: /(?<!\\)\$\d/,
    message:
      'Unescaped "$" before a digit triggers site-wide KaTeX inline math; escape dollar amounts as "\\$"'
  }
]

function slugifyHeading(value) {
  return value
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function bodyWithoutFrontmatter(text) {
  if (!text.startsWith('---\n')) return text
  const end = text.indexOf('\n---', 4)
  if (end === -1) return text
  return text.slice(end + '\n---'.length).replace(/^\r?\n+/, '')
}

function flushParagraph({ paragraphs, paragraph, startLine }) {
  if (!paragraph.length) return
  paragraphs.push({
    line: startLine,
    text: paragraph.join(' ').replace(/\s+/g, ' ').trim()
  })
}

function sourceStructureFailures(text, rel) {
  const body = bodyWithoutFrontmatter(text)
  const lines = body.split('\n')
  const issues = []
  const h1Lines = []
  const paragraphs = []
  let paragraph = []
  let paragraphStart = 0
  let inCode = false
  let inMath = false
  let inJsx = false

  const resetParagraph = () => {
    flushParagraph({ paragraphs, paragraph, startLine: paragraphStart })
    paragraph = []
    paragraphStart = 0
  }

  for (const [index, line] of lines.entries()) {
    const lineNo = index + 1
    const stripped = line.trim()

    if (stripped.startsWith('```')) {
      resetParagraph()
      inCode = !inCode
      continue
    }
    if (stripped.startsWith('$$')) {
      resetParagraph()
      inMath = !inMath
      continue
    }
    if (inCode || inMath) continue

    if (inJsx) {
      if (stripped.endsWith('/>') || stripped.endsWith('>')) inJsx = false
      continue
    }

    if (stripped.startsWith('<')) {
      resetParagraph()
      if (!stripped.endsWith('/>') && !stripped.endsWith('>')) inJsx = true
      continue
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(stripped)
    if (heading) {
      resetParagraph()
      if (heading[1] === '#') h1Lines.push(lineNo)
      const previous = index > 0 ? lines[index - 1].trim() : ''
      if (index > 0 && previous && previous !== '---') {
        issues.push(`${rel}:${lineNo}: heading must be preceded by a blank line`)
      }
      continue
    }

    if (
      !stripped ||
      stripped.startsWith('|') ||
      stripped.startsWith('>') ||
      stripped.startsWith('{/*') ||
      stripped.startsWith('import ') ||
      stripped.startsWith('export ') ||
      stripped.startsWith('![') ||
      /^(?:[-*]|\d+\.)\s+/.test(stripped)
    ) {
      resetParagraph()
      continue
    }

    if (!paragraph.length) paragraphStart = lineNo
    paragraph.push(stripped)
  }

  resetParagraph()

  if (h1Lines.length !== 1) {
    issues.push(`${rel}: expected exactly one H1, found ${h1Lines.length}`)
  }

  for (const { line, text: paragraphText } of paragraphs) {
    if (paragraphText.length > 520) {
      issues.push(
        `${rel}:${line}: paragraph is ${paragraphText.length} chars; this often means Google Docs collapsed paragraph breaks`
      )
    }
  }

  const flattenedRouteLink = /(^|[^`\]])\b[A-Z][A-Za-z0-9 &/'-]{1,80}\s+\(\/[a-z0-9][^) \n]*\)/m
  if (flattenedRouteLink.test(body)) {
    issues.push(`${rel}: possible flattened Markdown link like "Name (/route)"`)
  }

  return issues
}

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
          failures.push(
            `${rel}: description is ${description.length} chars (keep ≤160 so search engines don't truncate it)`
          )
        }
      }
    }

    const headingSlugs = new Map()
    for (const [index, line] of text.split('\n').entries()) {
      const match = /^(#{1,6})\s+(.+)$/.exec(line)
      if (!match) continue

      const slug = slugifyHeading(match[2])
      if (!slug) continue

      const firstLine = headingSlugs.get(slug)
      if (firstLine) {
        failures.push(
          `${rel}:${index + 1}: duplicate heading slug "${slug}" already used on line ${firstLine}`
        )
      } else {
        headingSlugs.set(slug, index + 1)
      }
    }

    failures.push(...sourceStructureFailures(text, rel))
  }

  for (const rule of forbiddenPatterns) {
    if (!isMdx && /HTML comments|GitHub-style|KaTeX/.test(rule.message)) continue
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
