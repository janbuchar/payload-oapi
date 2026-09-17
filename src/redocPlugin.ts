import type { Plugin } from 'payload'
import { apiRoute } from './utils/routes.js'

const redoc =
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
                  <title>Redoc</title>
                  <!-- needed for adaptive design -->
                  <meta charset="utf-8"/>
                  <meta name="viewport" content="width=device-width, initial-scale=1">

                  <!--
                  Redoc doesn't change outer page styles
                  -->
                  <style>
                    body {
                      margin: 0;
                      padding: 0;
                    }
                  </style>
                </head>
                <body>
                  <redoc spec-url="${req.protocol}//${req.headers.get('host')}${specUrl}"></redoc>
                  <script src="https://cdn.jsdelivr.net/npm/redoc@2.4.0/bundles/redoc.standalone.js"></script>
                </body>
              </html>`,
              { headers: { 'content-type': 'text/html' } },
            ),
        },
      ],
    }
  }

export default redoc
