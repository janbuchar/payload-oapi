import type { Plugin } from 'payload'
import type { PluginOptions } from './types.js'

import { createOAuthPasswordFlowHandler, createOpenAPIRequestHandler } from './requestHandlers.js'

const openapi =
  ({
    specEndpoint = '/openapi.json',
    authEndpoint = '/openapi-auth',
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
          handler: createOpenAPIRequestHandler({
            openapiVersion,
            metadata,
            authEndpoint,
          }),
        },
        {
          method: 'post',
          path: authEndpoint,
          handler: createOAuthPasswordFlowHandler(),
        },
      ],
    }
  }

export default openapi
