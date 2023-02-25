import type { Config, Plugin } from 'payload/config'
import type { Response, NextFunction, RequestHandler } from 'express'
import type { PayloadRequest } from 'payload/dist/express/types'

import httpStatus from 'http-status'

const swaggerUI =
  ({
    specEndpoint = '/openapi.json',
    docsUrl = '/docs',
  }: {
    specEndpoint?: string
    docsUrl?: string
  }): Plugin =>
  ({ onInit = () => {}, ...config }: Config): Config => ({
    ...config,
    onInit: async payload => {
      payload.router?.get(docsUrl, ((req: PayloadRequest, res: Response, next: NextFunction) =>
        res.status(httpStatus.OK).send(
          `
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
                url: '${req.protocol}://${req.header('host')}/api${specEndpoint}',
                dom_id: '#swagger-ui',
              });
            };
          </script>
          </body>
          </html>`,
        )) as unknown as RequestHandler)
      await onInit(payload)
    },
  })

export default swaggerUI
