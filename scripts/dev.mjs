import { spawn } from 'node:child_process'
import { rmSync } from 'node:fs'

const nodeOptions = [process.env.NODE_OPTIONS, '--no-experimental-webstorage']
  .filter(Boolean)
  .join(' ')

const distDir = process.env.NEXT_DIST_DIR ?? '.next-dev'

// The webpack dev cache is routinely poisoned by incremental invalidations
// (content file adds/removes, dependency swaps); once poisoned, every page
// 500s with "'useLayoutEffect' is not exported from 'react'" and restarts
// don't recover — only clearing the cache does. Cold compiles are cheap on
// this site, so start clean every time.
rmSync(`${distDir}/cache`, { recursive: true, force: true })

const child = spawn('next', ['dev', '--webpack', ...process.argv.slice(2)], {
  env: {
    ...process.env,
    // Isolate the dev server from `next build` (see distDir in next.config.mjs).
    NEXT_DIST_DIR: distDir,
    NODE_OPTIONS: nodeOptions
  },
  shell: process.platform === 'win32',
  stdio: 'inherit'
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
