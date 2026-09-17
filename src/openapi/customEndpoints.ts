import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import type { Endpoint } from 'payload'

import type { CustomEndpointDocumentation } from '../types.js'
import { camelize, upperFirst } from '../utils/strings.js'
import { apiKeySecurity } from './securitySchemes.js'

/**
 * OpenAPI has no path-item field for CONNECT, so such an endpoint cannot be expressed however it is
 * documented.
 */
const representableMethods = [
  'delete',
  'get',
  'head',
  'options',
  'patch',
  'post',
  'put',
] as const satisfies ReadonlyArray<Endpoint['method']>

type RepresentableMethod = (typeof representableMethods)[number]

const isRepresentable = (method: Endpoint['method']): method is RepresentableMethod =>
  (representableMethods as ReadonlyArray<string>).includes(method)

/**
 * Turns the `custom.openapi` operation objects of Payload `endpoints` into path items under
 * `basePath`. Documentation is merged last so a user can override every default, and operations are
 * inlined rather than minted as components: each would be referenced exactly once, and names built
 * from the method alone collided between two endpoints on the same entity.
 */
export const generateCustomEndpoints = (
  basePath: string,
  name: string,
  endpoints: Endpoint[] | false | undefined,
): Record<string, OpenAPIV3.PathItemObject & OpenAPIV3_1.PathItemObject> => {
  const operations: Record<string, OpenAPIV3.PathItemObject & OpenAPIV3_1.PathItemObject> = {}

  for (const endpoint of endpoints === false ? [] : (endpoints ?? [])) {
    const documentation = endpoint.custom?.openapi as CustomEndpointDocumentation | undefined

    if (documentation === undefined || !isRepresentable(endpoint.method)) {
      continue
    }

    // Payload matches Express-style `:param` segments, which OpenAPI templates as `{param}`.
    const path = `${basePath}${endpoint.path.replace(/:([^/]+)/g, '{$1}')}`

    operations[path] = {
      ...operations[path],
      [endpoint.method]: {
        tags: [name],
        operationId:
          endpoint.method +
          camelize(`${name} ${endpoint.path.replace(/[^a-zA-Z0-9]+/g, ' ')}`.trim()),
        summary: `${upperFirst(endpoint.method)} ${path}`,
        // Access control of a custom endpoint is opaque to the generator, so assume it needs a key.
        security: [apiKeySecurity],
        ...documentation,
        // 3.0 requires `responses`; saying only that the call can succeed beats inventing a body.
        responses: documentation.responses ?? { 200: { description: 'Successful response' } },
      },
    }
  }

  return operations
}
