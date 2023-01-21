import { Response, NextFunction } from 'express'
import httpStatus from 'http-status'
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { PayloadRequest } from 'payload/dist/express/types'

import { generateV30Spec, generateV31Spec } from './openapiSpec'
import { PluginOptions } from './types'

export const createOpenAPIRequestHandler =
  ({ openapiVersion, metadata }: Pick<PluginOptions, 'openapiVersion' | 'metadata'>) =>
  async (
    req: PayloadRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response<OpenAPIV3.Document | OpenAPIV3_1.Document> | void> => {
    try {
      switch (openapiVersion) {
        case '3.0':
          return res.status(httpStatus.OK).json(await generateV30Spec(req, metadata))
        case '3.1':
          return res.status(httpStatus.OK).json(await generateV31Spec(req, metadata))
      }
    } catch (error) {
      return next(error)
    }
  }
