import type { OpenAPIV3_1 } from 'openapi-types'

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

export interface PluginOptions {
  enabled?: boolean
  openapiVersion?: OpenAPIVersion
  specEndpoint?: string
  authEndpoint?: string
  metadata: OpenAPIMetadata
  filters?: FilterOptions
  /** Path prefix for generated operations, defaults to the Payload `routes.api` setting. */
  apiBasePath?: string | null
}

export type SanitizedPluginOptions = Required<Omit<PluginOptions, 'enabled' | 'specEndpoint'>>

/**
 * OpenAPI operation describing a Payload `endpoints` entry, supplied as `custom.openapi` on the
 * endpoint. Always written in 3.1 syntax - a 3.0 spec is down-converted on the way out - and merged
 * over the generated defaults, so setting `tags`, `operationId`, `security` or `responses` replaces
 * them.
 */
export type CustomEndpointDocumentation = OpenAPIV3_1.OperationObject
