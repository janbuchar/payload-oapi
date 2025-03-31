import type { PayloadRequest } from 'payload'
import type { SanitizedPluginOptions } from './types.js'

import { generateV30Spec, generateV31Spec } from './openapi/generators.js'

export const createOpenAPIRequestHandler =
  (options: SanitizedPluginOptions) =>
  async (req: PayloadRequest): Promise<Response> => {
    switch (options.openapiVersion) {
      case '3.0':
        return Response.json(await generateV30Spec(req, options))
      case '3.1':
        return Response.json(await generateV31Spec(req, options))
    }

    throw new Error('Invalid `openapiVersion`')
  }

export const createOAuthPasswordFlowHandler =
  () =>
  async (req: PayloadRequest): Promise<Response> => {
    const formData = await req.formData!()
    const collection = req.payload.collections[req.payload.config.admin.user]

    const data =
      collection.config.auth?.loginWithUsername !== false
        ? {
            email: formData.get('username')!.toString(),
            username: formData.get('username')!.toString(),
            password: formData.get('password')!.toString(),
          }
        : {
            email: formData.get('username')!.toString(),
            password: formData.get('password')!.toString(),
          }

    const response = await req.payload.login({
      collection: collection.config.slug,
      data,
    })

    return Response.json({
      access_token: response.token,
      token_type: 'JWT',
      expires_in:
        response.exp !== undefined
          ? response.exp - Math.floor(new Date().valueOf() / 1000)
          : undefined,
    })
  }
