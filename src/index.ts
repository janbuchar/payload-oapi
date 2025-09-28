import openapi from './openapiPlugin.js'
import rapidoc from './rapidocPlugin.js'
import redoc from './redocPlugin.js'
import scalar from './scalarPlugin.js'
import swaggerUI from './swaggerUIPlugin.js'
import type { CustomEndpointDocumentation } from './types.js'
import { createCustomEndpointDocumentation } from './utils/customEndpoints.js'

export { openapi, swaggerUI, rapidoc, redoc, scalar, createCustomEndpointDocumentation }
export type { CustomEndpointDocumentation }
