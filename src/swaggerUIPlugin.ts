import type { Config, Plugin } from 'payload'

const swaggerUI =
  ({
    specEndpoint = '/openapi.json',
    docsUrl = '/docs',
    enabled = true,
  }: {
    specEndpoint?: string
    docsUrl?: string
    enabled?: boolean
  }): Plugin =>
  ({ endpoints = [], ...config }: Config): Config => {
    if (!enabled) {
      return { ...config, endpoints }
    }
    return {
      ...config,
      endpoints: [
        ...endpoints,
        {
          method: 'get',
          path: docsUrl,
          handler: async req =>
            new Response(`
              <!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta
                  name="description"
                  content="SwaggerUI"
                />
                <title>SwaggerUI</title>
                <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.16.1/swagger-ui.css" />
              </head>
              <body>
              <div id="swagger-ui"></div>
              <script src="https://unpkg.com/swagger-ui-dist@4.16.1/swagger-ui-bundle.js" crossorigin></script>
              <script>
                window.onload = () => {
                  window.ui = SwaggerUIBundle({
                    url: '${req.protocol}://${req.headers.get('host')}${specEndpoint}',
                    dom_id: '#swagger-ui',
                  });
                };
              </script>
              </body>
              </html>`),
        },
      ],
    }
  }

export default swaggerUI
