import type { Plugin } from 'payload'
import { apiRoute } from './utils/routes.js'

const rapidoc =
  ({
    specEndpoint,
    docsUrl = '/docs',
    enabled = true,
  }: {
    specEndpoint?: string
    docsUrl?: string
    enabled?: boolean
  }): Plugin =>
  ({ endpoints = [], ...config }) => {
    if (!enabled) {
      return { ...config, endpoints }
    }

    const specUrl = specEndpoint ?? `${apiRoute(config)}/openapi.json`

    return {
      ...config,
      endpoints: [
        ...endpoints,
        {
          method: 'get',
          path: docsUrl,
          handler: async req =>
            new Response(
              `
              <!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta
                  name="description"
                  content="Rapidoc"
                />
                <title>Rapidoc</title>
              </head>
              <body>
              <script src="https://cdn.jsdelivr.net/npm/rapidoc@9.3.8/dist/rapidoc-min.js" type="module"></script>
              <rapi-doc spec-url="${req.protocol}//${req.headers.get('host')}${specUrl}"></rapi-doc>
              </body>
              </html>`,
              { headers: { 'content-type': 'text/html' } },
            ),
        },
      ],
    }
  }

export default rapidoc
