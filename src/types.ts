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
