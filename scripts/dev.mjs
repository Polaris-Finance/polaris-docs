import { spawn } from 'node:child_process'
import { rmSync } from 'node:fs'

const nodeOptions = [process.env.NODE_OPTIONS, '--no-experimental-webstorage']
  .filter(Boolean)
  .join(' ')

const distDir = process.env.NEXT_DIST_DIR ?? '.next-dev'

// A poisoned webpack cache makes React's client exports resolve against the
// server build. Next nests dev state differently across versions, so reset the
// dedicated dev output rather than depending on its internal cache path.
rmSync(distDir, { recursive: true, force: true })

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
