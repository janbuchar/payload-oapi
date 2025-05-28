export type OpenAPIVersion = '3.0' | '3.1'

export interface OpenAPIMetadata {
  title: string
  version: string
  description?: string
}

export type FilterFunction<T> = (item: T) => boolean

export type CRUDOperation = 'create' | 'read' | 'update' | 'delete' | 'list'

export interface OperationFilter {
  // Include/exclude specific operations for collections
  includeOperations?: CRUDOperation[]
  excludeOperations?: CRUDOperation[]
  // Custom operation filter per collection
  operationFilter?: (operation: CRUDOperation, collection: { slug: string; config: any }) => boolean
}

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
  // Operation-level filtering
  operations?: OperationFilter
  // Field-level filtering
  excludeFields?:
    | string[]
    | FilterFunction<{ name: string; type: string; collection: { slug: string; config: any } }>
  // Hide internal collections
  hideInternalCollections?: boolean // Hide payload-* collections
}

export type SanitizedPluginOptions = Required<
  Omit<
    PluginOptions,
    | 'enabled'
    | 'specEndpoint'
    | 'includeCollections'
    | 'excludeCollections'
    | 'includeGlobals'
    | 'excludeGlobals'
    | 'operations'
    | 'excludeFields'
    | 'hideInternalCollections'
  >
> & {
  includeCollections?: string[] | FilterFunction<{ slug: string; config: any }>
  excludeCollections?: string[] | FilterFunction<{ slug: string; config: any }>
  includeGlobals?: string[] | FilterFunction<{ slug: string }>
  excludeGlobals?: string[] | FilterFunction<{ slug: string }>
  operations?: OperationFilter
  excludeFields?:
    | string[]
    | FilterFunction<{ name: string; type: string; collection: { slug: string; config: any } }>
  hideInternalCollections?: boolean
}
