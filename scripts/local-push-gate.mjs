import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const args = new Set(process.argv.slice(2))
const strictNode = args.has('--strict-node') || process.env.LOCAL_PUSH_GATE_STRICT_NODE === '1'
const skipInstall = args.has('--skip-install') || process.env.LOCAL_PUSH_GATE_SKIP_INSTALL === '1'
const skipBrowserInstall =
  args.has('--skip-browser-install') || process.env.LOCAL_PUSH_GATE_SKIP_BROWSER_INSTALL === '1'
const strictExternal =
  args.has('--strict-external') || process.env.LOCAL_PUSH_GATE_STRICT_EXTERNAL === '1'
const withBrowserDeps =
  args.has('--with-browser-deps') || process.env.LOCAL_PUSH_GATE_WITH_BROWSER_DEPS === '1'

const deployWorkflow = '.github/workflows/deploy.yml'
const optionalFailures = []

function readText(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8').trim()
}

function major(version) {
  const match = version.match(/(\d+)/)
  return match ? Number(match[1]) : null
}

function getNpmVersion() {
  try {
    return execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

function assertRuntime() {
  const packageJson = JSON.parse(readText('package.json'))
  const nodeMajor = major(process.version)
  const npmVersion = getNpmVersion()
  const npmMajor = npmVersion ? major(npmVersion) : null
  const expectedNodeMajor = existsSync(path.join(root, '.nvmrc')) ? major(readText('.nvmrc')) : null

  if (nodeMajor === null || nodeMajor < 22 || nodeMajor >= 27) {
    console.error(
      `Local push gate requires Node ${packageJson.engines?.node ?? '>=22 <27'}; found ${
        process.version
      }.`
    )
    process.exit(1)
  }

  if (npmMajor === null || npmMajor < 10) {
    console.error(
      `Local push gate requires npm ${packageJson.engines?.npm ?? '>=10'}; found ${
        npmVersion ?? 'unavailable'
      }.`
    )
    process.exit(1)
  }

  if (expectedNodeMajor !== null && nodeMajor !== expectedNodeMajor) {
    const message = `GitHub Pages deploy uses Node ${expectedNodeMajor} from .nvmrc; this shell uses ${process.version}.`
    if (strictNode) {
      console.error(`${message} Re-run under Node ${expectedNodeMajor}, or unset strict node mode.`)
      process.exit(1)
    }
    console.warn(`${message} Continuing because the package engine range allows it.`)
  }
}

function assertDeployWorkflowStillMatchesGate() {
  const workflow = readText(deployWorkflow)
  const expectedFragments = [
    'npm ci',
    'npx playwright install',
    'npm run ci',
    'npm run check:links:external',
    'npm run check:artifact'
  ]
  const missingFragments = expectedFragments.filter((fragment) => !workflow.includes(fragment))

  if (missingFragments.length) {
    console.error(
      `Local push gate no longer matches ${deployWorkflow}; missing ${missingFragments.join(', ')}.`
    )
    console.error('Update scripts/local-push-gate.mjs before relying on this hook.')
    process.exit(1)
  }
}

function runStep({ label, command, optional = false }) {
  const stepStartedAt = Date.now()
  console.log(`\n==> ${label}`)
  console.log(`$ ${command}`)

  const result = spawnSync(command, {
    cwd: root,
    env: {
      ...process.env,
      CI: 'true'
    },
    shell: true,
    stdio: 'inherit'
  })

  const durationSeconds = ((Date.now() - stepStartedAt) / 1000).toFixed(1)
  if (result.status === 0) {
    console.log(`==> ${label} passed in ${durationSeconds}s`)
    return
  }

  const exitCode = result.status ?? 1
  if (optional) {
    optionalFailures.push(label)
    console.warn(`==> ${label} failed in ${durationSeconds}s but is non-blocking in deploy.yml`)
    return
  }

  console.error(`==> ${label} failed in ${durationSeconds}s`)
  process.exit(exitCode)
}

assertRuntime()
assertDeployWorkflowStillMatchesGate()

console.log('Local push gate: mirroring the reproducible build side of GitHub Pages deploy.')
console.log(`Workflow source: ${deployWorkflow}`)
console.log('GitHub-only boundary: upload-pages-artifact and deploy-pages are not run locally.')

const steps = [
  {
    label: 'Install dependencies',
    command: 'npm ci',
    skip: skipInstall
  },
  {
    label: 'Install Playwright browsers',
    command: withBrowserDeps
      ? 'npx playwright install --with-deps chromium'
      : 'npx playwright install chromium',
    skip: skipBrowserInstall
  },
  {
    label: 'Validate and build static site',
    command: 'npm run ci'
  },
  {
    label: 'Check external links',
    command: 'npm run check:links:external',
    optional: !strictExternal
  },
  {
    label: 'Smoke check Pages artifact URLs',
    command: 'npm run check:artifact'
  }
]

for (const step of steps) {
  if (step.skip) {
    console.log(`\n==> ${step.label} skipped by local gate option`)
    continue
  }
  runStep(step)
}

if (optionalFailures.length) {
  console.warn(
    `\nLocal push gate passed with non-blocking warning(s): ${optionalFailures.join(', ')}`
  )
} else {
  console.log('\nLocal push gate passed.')
}
