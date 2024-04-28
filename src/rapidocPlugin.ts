import type { Plugin } from 'payload/config'

import httpStatus from 'http-status'

const rapidoc =
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
            )}${specEndpoint}"></rapi-doc>
          </body>
          </html>`,
          ),
        )
        await onInit(payload)
      },
    }
  }

export default rapidoc
