import { RequestHandler } from 'express'
import type { Config } from 'payload/config'
import { createOpenAPIRequestHandler } from './requestHandlers'
import { PluginOptions } from './types'

const openapi =
  ({ specEndpoint = '/openapi.json', openapiVersion = '3.0', metadata }: PluginOptions) =>
  ({ onInit = () => {}, ...config }: Config): Config => ({
    ...config,
    onInit: async payload => {
      payload.router!.get(
        specEndpoint,
        createOpenAPIRequestHandler({ openapiVersion, metadata }) as unknown as RequestHandler,
      )
      await onInit(payload)
    },
  })

export default openapi
