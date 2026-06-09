import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { BASE_PATH } from '../app/site-config.mjs'

const root = process.cwd()
const outDir = path.join(root, 'out')
const args = process.argv.slice(2)
const portArg = args.find((arg) => arg.startsWith('--port='))
const portValue = portArg?.split('=')[1] ?? args[args.indexOf('--port') + 1]
const port = Number(portValue ?? process.env.PORT ?? 4173)
const host = process.env.HOST ?? '127.0.0.1'

if (!existsSync(outDir) || !statSync(outDir).isDirectory()) {
  console.error('Missing static export in out/. Run `npm run build` before serving the export.')
  process.exit(1)
}

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.md', 'text/markdown; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.wasm', 'application/wasm'],
  ['.woff2', 'font/woff2'],
  ['.xml', 'application/xml; charset=utf-8']
])

function send(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'content-type': contentType })
  res.end(body)
}

function publicPathForRequest(url) {
  const pathname = decodeURIComponent(new URL(url, `http://${host}:${port}`).pathname)

  if (!BASE_PATH) return pathname
  if (pathname === '/') return `${BASE_PATH}/`
  if (pathname === BASE_PATH || pathname.startsWith(`${BASE_PATH}/`)) {
    return pathname.slice(BASE_PATH.length) || '/'
  }

  return null
}

function candidateFiles(publicPath) {
  const cleanPath = publicPath.replace(/^\/+/, '')
  if (!cleanPath) return [path.join(outDir, 'index.html')]

  const direct = path.join(outDir, cleanPath)
  const extension = path.extname(cleanPath)
  const candidates = [direct]

  if (!extension) {
    candidates.push(path.join(outDir, `${cleanPath}.html`))
    candidates.push(path.join(outDir, cleanPath, 'index.html'))
  }

  return candidates
}

function resolveFile(publicPath) {
  for (const candidate of candidateFiles(publicPath)) {
    if (!existsSync(candidate)) continue
    const stat = statSync(candidate)
    if (stat.isFile()) return candidate
  }
  return null
}

const server = createServer((req, res) => {
  const publicPath = publicPathForRequest(req.url ?? '/')

  if (publicPath === null) {
    send(res, 404, 'Not found')
    return
  }

  if (BASE_PATH && publicPath === `${BASE_PATH}/`) {
    res.writeHead(302, { location: `${BASE_PATH}/` })
    res.end()
    return
  }

  const file = resolveFile(publicPath)

  if (!file) {
    const notFound = resolveFile('/404')
    if (notFound) {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' })
      createReadStream(notFound).pipe(res)
      return
    }
    send(res, 404, 'Not found')
    return
  }

  const contentType = contentTypes.get(path.extname(file)) ?? 'application/octet-stream'
  res.writeHead(200, { 'content-type': contentType })
  createReadStream(file).pipe(res)
})

server.listen(port, host, () => {
  const base = BASE_PATH || '/'
  console.log(`Serving out/ at http://${host}:${port}${base}`)
})
