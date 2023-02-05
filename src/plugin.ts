import type { RequestHandler } from 'express'
import type { Config, Plugin } from 'payload/config'
import type { PluginOptions } from './types'

import { createOpenAPIRequestHandler } from './requestHandlers'

const openapi =
  ({ specEndpoint = '/openapi.json', openapiVersion = '3.0', metadata }: PluginOptions): Plugin =>
  ({ onInit = () => {}, ...config }: Config): Config => ({
    ...config,
    onInit: async payload => {
      payload.router?.get(
        specEndpoint,
        createOpenAPIRequestHandler({ openapiVersion, metadata }) as unknown as RequestHandler,
      )
      await onInit(payload)
    },
  })

export default openapi
