import { spawn } from 'node:child_process'

const nodeOptions = [process.env.NODE_OPTIONS, '--no-experimental-webstorage']
  .filter(Boolean)
  .join(' ')

const child = spawn('next', ['dev', '--webpack', ...process.argv.slice(2)], {
  env: {
    ...process.env,
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
