import { spawn } from 'node:child_process'

const nodeOptions = [process.env.NODE_OPTIONS, '--no-experimental-webstorage']
  .filter(Boolean)
  .join(' ')

const child = spawn('next', ['dev', '--webpack', ...process.argv.slice(2)], {
  env: {
    ...process.env,
    // Isolate the dev server from `next build` (see distDir in next.config.mjs).
    NEXT_DIST_DIR: process.env.NEXT_DIST_DIR ?? '.next-dev',
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
