import type { Plugin } from 'payload'
import type { PluginOptions } from './types.js'

import { createOpenAPIRequestHandler } from './requestHandlers.js'

const openapi =
  ({
    specEndpoint = '/openapi.json',
    openapiVersion = '3.0',
    metadata,
    enabled = true,
  }: PluginOptions): Plugin =>
  ({ endpoints = [], ...config }) => {
    if (!enabled) {
      return { ...config, endpoints }
    }

    return {
      ...config,
      endpoints: [
        ...endpoints,
        {
          method: 'get',
          path: specEndpoint,
          handler: createOpenAPIRequestHandler({ openapiVersion, metadata }),
        },
      ],
    }
  }

export default openapi
