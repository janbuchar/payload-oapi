import type { Plugin } from 'payload'
import { createOAuthPasswordFlowHandler, createOpenAPIRequestHandler } from './requestHandlers.js'
import type { PluginOptions } from './types.js'

const openapi =
  ({
    specEndpoint = '/openapi.json',
    authEndpoint = '/openapi-auth',
    openapiVersion = '3.0',
    metadata,
    enabled = true,
    includeCollections,
    excludeCollections,
    hideInternalCollections,
    includeGlobals,
    excludeGlobals,
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
            includeCollections,
            excludeCollections,
            hideInternalCollections,
            includeGlobals,
            excludeGlobals,
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
