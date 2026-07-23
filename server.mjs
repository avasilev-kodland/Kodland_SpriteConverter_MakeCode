import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const distDirectory = resolve(fileURLToPath(new URL('./dist/', import.meta.url)))
const port = Number(process.env.PORT) || 4173
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', 'http://localhost')
    const requestedPath = decodeURIComponent(url.pathname)
    const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.slice(1)
    const filePath = resolve(distDirectory, relativePath)

    if (!filePath.startsWith(`${distDirectory}${sep}`) && filePath !== distDirectory) {
      send(response, 403, 'Forbidden', 'text/plain; charset=utf-8')
      return
    }

    try {
      const content = await readFile(filePath)
      send(response, 200, content, mimeTypes[extname(filePath)] ?? 'application/octet-stream')
    } catch (error) {
      if (error?.code !== 'ENOENT' && error?.code !== 'EISDIR') throw error
      const fallback = await readFile(resolve(distDirectory, 'index.html'))
      send(response, 200, fallback, mimeTypes['.html'])
    }
  } catch {
    send(response, 400, 'Bad request', 'text/plain; charset=utf-8')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Arcade Sprite Lab is running on port ${port}`)
})

function send(response, status, body, contentType) {
  response.writeHead(status, {
    'Content-Type': contentType,
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; frame-ancestors *; base-uri 'self'; form-action 'self'",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
  })
  response.end(body)
}
