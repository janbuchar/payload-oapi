import type { Plugin } from 'payload/config'
import type { PluginOptions } from './types'

import { createOpenAPIRequestHandler } from './requestHandlers'

const openapi =
  ({
    specEndpoint = '/openapi.json',
    openapiVersion = '3.0',
    metadata,
    enabled = true,
  }: PluginOptions): Plugin =>
  ({ onInit = () => {}, ...config }) => {
    if (!enabled) {
      return config
    }

    return {
      ...config,
      onInit: async payload => {
        payload.express
          ?.route(specEndpoint)
          .get(createOpenAPIRequestHandler({ openapiVersion, metadata }))

        await onInit(payload)
      },
    }
  }

export default openapi
