import type { Config, Plugin } from 'payload/config'
import type { Response, NextFunction, RequestHandler } from 'express'
import type { PayloadRequest } from 'payload/dist/express/types'

import httpStatus from 'http-status'

const rapidoc =
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
              content="Rapidoc"
            />
            <title>Rapidoc</title>
          </head>
          <body>
          <script src="https://unpkg.com/rapidoc@9.3.4/dist/rapidoc-min.js" type="module"></script>
          <rapi-doc spec-url="${req.protocol}://${req.header(
            'host',
          )}/api${specEndpoint}"></rapi-doc>
          </body>
          </html>`,
        )) as unknown as RequestHandler)
      await onInit(payload)
    },
  })

export default rapidoc
