import httpStatus from 'http-status'
import type { Plugin } from 'payload/config'

const redoc =
  ({
    specEndpoint = '/openapi.json',
    docsUrl = '/docs',
    enabled = true,
  }: {
    specEndpoint?: string
    docsUrl?: string
    enabled?: boolean
  }): Plugin =>
  ({ onInit = () => {}, ...config }) => {
    if (!enabled) {
      return { ...config, onInit }
    }
    return {
      ...config,
      onInit: async payload => {
        payload.express?.route(docsUrl).get((req, res) =>
          res.status(httpStatus.OK).send(
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
                <redoc spec-url="${req.protocol}://${req.header('host')}${specEndpoint}"></redoc>
                <script src="https://unpkg.com/redoc@^2/bundles/redoc.standalone.js"></script>
              </body>
            </html>`,
          ),
        )
        await onInit(payload)
      },
    }
  }

export default redoc
