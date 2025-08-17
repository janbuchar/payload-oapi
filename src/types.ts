import type { JSONSchema4 } from 'json-schema'
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

export type OpenAPIVersion = '3.0' | '3.1'

export interface OpenAPIMetadata {
  title: string
  version: string
  description?: string
}

export interface PluginOptions {
  enabled?: boolean
  openapiVersion?: OpenAPIVersion
  specEndpoint?: string
  authEndpoint?: string
  metadata: OpenAPIMetadata
}

export type SanitizedPluginOptions = Required<Omit<PluginOptions, 'enabled' | 'specEndpoint'>>

type ParameterObject<TVersion extends OpenAPIVersion = '3.1'> = TVersion extends '3.1'
  ? OpenAPIV3_1.ParameterObject
  : OpenAPIV3.ParameterObject

type SchemaObject<TVersion extends OpenAPIVersion = '3.1'> = TVersion extends '3.1'
  ? OpenAPIV3_1.SchemaObject
  : OpenAPIV3.SchemaObject

export interface CustomEndpointDocumentation<TVersion extends OpenAPIVersion = '3.1'> {
  description: string
  parameters?: ParameterObject<TVersion>[]
  queryParameters?: Record<
    string,
    {
      description?: string
      required?: boolean
      schema: SchemaObject<TVersion> | string
    }
  >
  requestBody?: SchemaObject<TVersion>
  responses?: Record<string, JSONSchema4>
  summary?: string
}
