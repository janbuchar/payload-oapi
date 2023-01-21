export type OpenAPIVersion = '3.0' | '3.1'

export interface OpenAPIMetadata {
  title: string
  version: string
  description?: string
}

export interface PluginOptions {
  openapiVersion?: OpenAPIVersion
  specEndpoint?: string
  metadata: OpenAPIMetadata
}
