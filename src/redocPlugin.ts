import type { NextFunction, RequestHandler, Response } from 'express'

import httpStatus from 'http-status'
import type { Config, Plugin } from 'payload/config'
import type { PayloadRequest } from 'payload/dist/express/types'

const redoc =
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
                <title>Redoc</title>
                <!-- needed for adaptive design -->
                <meta charset="utf-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
            
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
                <redoc spec-url="${req.protocol}://${req.header(
            'host',
          )}/api${specEndpoint}"></redoc>
                <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
              </body>
            </html>`,
        )) as unknown as RequestHandler)
      await onInit(payload)
    },
  })

export default redoc
