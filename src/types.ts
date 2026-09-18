import type { OpenAPIV3_1 } from 'openapi-types'
import type { PayloadRequest } from 'payload'

export type OpenAPIVersion = '3.0' | '3.1'

export interface OpenAPIMetadata {
  title: string
  version: string
  description?: string
}

export interface FilterOptions {
  includeCollections?: string[]
  excludeCollections?: string[]
  hideInternalCollections?: boolean
  includeGlobals?: string[]
  excludeGlobals?: string[]
}

/** Returning nothing keeps the mutated argument; `() => void` cannot be typed as `() => undefined`. */
// biome-ignore lint/suspicious/noConfusingVoidType: see above
type SpecAdjustment = OpenAPIV3_1.Document | void

export interface PluginOptions {
  enabled?: boolean
  openapiVersion?: OpenAPIVersion
  specEndpoint?: string
  authEndpoint?: string
  metadata: OpenAPIMetadata
  filters?: FilterOptions
  /** Path prefix for generated operations, defaults to the Payload `routes.api` setting. */
  apiBasePath?: string | null
  /**
   * Last word on the generated document. Receives a 3.1 document even when `openapiVersion` is
   * `'3.0'` - write 3.1 syntax and it is down-converted afterwards, like `custom.openapi`. Mutate
   * the argument or return a replacement. Runs per request, after `$ref` targets are resolved.
   *
   * Component names derive from `labels.singular`, so they are not a stable contract - reuse a
   * `$ref` the generator emitted rather than assembling one from a slug:
   *
   * ```typescript
   * const posts = spec.paths['/api/posts'].get.responses['200'] // { $ref: '…/PostListResponse' }
   * spec.paths['/external/latest'] = { get: { responses: { 200: posts } } }
   * ```
   */
  adjustGeneratedSpec?: (
    spec: OpenAPIV3_1.Document,
    req: Pick<PayloadRequest, 'payload' | 'protocol' | 'headers'>,
  ) => SpecAdjustment | Promise<SpecAdjustment>
}

export type SanitizedPluginOptions = Required<
  Omit<PluginOptions, 'enabled' | 'specEndpoint' | 'adjustGeneratedSpec'>
> &
  Pick<PluginOptions, 'adjustGeneratedSpec'>

/**
 * OpenAPI operation describing a Payload `endpoints` entry, supplied as `custom.openapi` on the
 * endpoint. Always written in 3.1 syntax - a 3.0 spec is down-converted on the way out - and merged
 * over the generated defaults, so setting `tags`, `operationId`, `security` or `responses` replaces
 * them.
 */
export type CustomEndpointDocumentation = OpenAPIV3_1.OperationObject
