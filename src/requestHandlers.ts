import type { Request, Response, NextFunction } from 'express'
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import type { PayloadRequest } from 'payload/dist/express/types'
import type { PluginOptions } from './types'

import httpStatus from 'http-status'
import { generateV30Spec, generateV31Spec } from './openapiSpec'

export const createOpenAPIRequestHandler =
  ({ openapiVersion, metadata }: Pick<PluginOptions, 'openapiVersion' | 'metadata'>) =>
  async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response<OpenAPIV3.Document | OpenAPIV3_1.Document> | void> => {
    const req = _req as PayloadRequest

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
