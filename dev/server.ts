import type { NextServerOptions } from 'next/dist/server/next.js'

import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath, parse } from 'node:url'
import next from 'next'
import open from 'open'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const port = 3005

const opts: NextServerOptions = {
  dev: true,
  dir: dirname,
  port,
}

// @ts-expect-error next types do not import
const app = next(opts)
const handle = app.getRequestHandler()

await app.prepare()

await open(`http://localhost:${port}/admin`)

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url!, true)
  void handle(req, res, parsedUrl)
})

server.listen(port)
