import type { PayloadRequest } from 'payload'
import type { PluginOptions } from './types.js'

import { generateV30Spec, generateV31Spec } from './openapi/generators.js'

export const createOpenAPIRequestHandler =
  ({ openapiVersion, metadata }: Pick<PluginOptions, 'openapiVersion' | 'metadata'>) =>
  async (req: PayloadRequest): Promise<Response> => {
    switch (openapiVersion) {
      case '3.0':
        return Response.json(await generateV30Spec(req, metadata))
      case '3.1':
        return Response.json(await generateV31Spec(req, metadata))
    }

    throw new Error('Invalid `openapiVersion`')
  }
