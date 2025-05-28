export type OpenAPIVersion = '3.0' | '3.1'

export interface OpenAPIMetadata {
  title: string
  version: string
  description?: string
}

export type FilterFunction<T> = (item: T) => boolean

export interface PluginOptions {
  enabled?: boolean
  openapiVersion?: OpenAPIVersion
  specEndpoint?: string
  authEndpoint?: string
  metadata: OpenAPIMetadata
  // Collection filtering options
  includeCollections?: string[] | FilterFunction<{ slug: string; config: any }>
  excludeCollections?: string[] | FilterFunction<{ slug: string; config: any }>
  // Global filtering options
  includeGlobals?: string[] | FilterFunction<{ slug: string }>
  excludeGlobals?: string[] | FilterFunction<{ slug: string }>
}

export type SanitizedPluginOptions = Required<Omit<PluginOptions, 'enabled' | 'specEndpoint' | 'includeCollections' | 'excludeCollections' | 'includeGlobals' | 'excludeGlobals'>> & {
  includeCollections?: string[] | FilterFunction<{ slug: string; config: any }>
  excludeCollections?: string[] | FilterFunction<{ slug: string; config: any }>
  includeGlobals?: string[] | FilterFunction<{ slug: string }>
  excludeGlobals?: string[] | FilterFunction<{ slug: string }>
}
