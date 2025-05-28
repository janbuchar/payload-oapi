import type { Collection, SanitizedGlobalConfig, Field } from 'payload'
import type { FilterFunction, SanitizedPluginOptions, CRUDOperation } from '../types.js'

/**
 * Filters collections based on include/exclude options
 */
export function filterCollections(
  collections: Record<string, Collection>,
  options: Pick<SanitizedPluginOptions, 'includeCollections' | 'excludeCollections' | 'hideInternalCollections'>
): Collection[] {
  const allCollections = Object.values(collections)
  
  let filteredCollections = allCollections

  // Hide internal Payload collections
  if (options.hideInternalCollections) {
    filteredCollections = filteredCollections.filter(collection =>
      !collection.config.slug.startsWith('payload-')
    )
  }

  // Apply include filter first
  if (options.includeCollections) {
    if (Array.isArray(options.includeCollections)) {
      filteredCollections = filteredCollections.filter(collection =>
        (options.includeCollections as string[]).includes(collection.config.slug)
      )
    } else {
      filteredCollections = filteredCollections.filter(collection =>
        (options.includeCollections as FilterFunction<{ slug: string; config: any }>)({
          slug: collection.config.slug,
          config: collection.config
        })
      )
    }
  }

  // Apply exclude filter
  if (options.excludeCollections) {
    if (Array.isArray(options.excludeCollections)) {
      filteredCollections = filteredCollections.filter(collection =>
        !(options.excludeCollections as string[]).includes(collection.config.slug)
      )
    } else {
      filteredCollections = filteredCollections.filter(collection =>
        !(options.excludeCollections as FilterFunction<{ slug: string; config: any }>)({
          slug: collection.config.slug,
          config: collection.config
        })
      )
    }
  }

  return filteredCollections
}

/**
 * Filters globals based on include/exclude options
 */
export function filterGlobals(
  globals: SanitizedGlobalConfig[],
  options: Pick<SanitizedPluginOptions, 'includeGlobals' | 'excludeGlobals'>
): SanitizedGlobalConfig[] {
  let filteredGlobals = globals

  // Apply include filter first
  if (options.includeGlobals) {
    if (Array.isArray(options.includeGlobals)) {
      filteredGlobals = filteredGlobals.filter(global =>
        (options.includeGlobals as string[]).includes(global.slug)
      )
    } else {
      filteredGlobals = filteredGlobals.filter(global =>
        (options.includeGlobals as FilterFunction<{ slug: string }>)({
          slug: global.slug
        })
      )
    }
  }

  // Apply exclude filter
  if (options.excludeGlobals) {
    if (Array.isArray(options.excludeGlobals)) {
      filteredGlobals = filteredGlobals.filter(global =>
        !(options.excludeGlobals as string[]).includes(global.slug)
      )
    } else {
      filteredGlobals = filteredGlobals.filter(global =>
        !(options.excludeGlobals as FilterFunction<{ slug: string }>)({
          slug: global.slug
        })
      )
    }
  }

  return filteredGlobals
}

/**
 * Checks if a specific operation should be included for a collection
 */
export function shouldIncludeOperation(
  operation: CRUDOperation,
  collection: Collection,
  options: Pick<SanitizedPluginOptions, 'operations'>
): boolean {
  if (!options.operations) return true

  const { includeOperations, excludeOperations, operationFilter } = options.operations

  // Apply custom operation filter first
  if (operationFilter) {
    return operationFilter(operation, {
      slug: collection.config.slug,
      config: collection.config
    })
  }

  // Apply include filter
  if (includeOperations && !includeOperations.includes(operation)) {
    return false
  }

  // Apply exclude filter
  if (excludeOperations && excludeOperations.includes(operation)) {
    return false
  }

  return true
}

/**
 * Filters fields based on options
 */
export function filterFields(
  fields: Field[],
  collection: Collection,
  options: Pick<SanitizedPluginOptions, 'excludeFields'>
): Field[] {
  let filteredFields = fields

  // Apply exclude filter
  if (options.excludeFields) {
    if (Array.isArray(options.excludeFields)) {
      filteredFields = filteredFields.filter(field => {
        const fieldName = (field as any).name
        return !fieldName || !(options.excludeFields as string[]).includes(fieldName)
      })
    } else {
      filteredFields = filteredFields.filter(field => {
        const fieldName = (field as any).name
        const fieldType = field.type
        if (!fieldName) return true
        
        return !(options.excludeFields as FilterFunction<{ name: string; type: string; collection: { slug: string; config: any } }>)({
          name: fieldName,
          type: fieldType,
          collection: {
            slug: collection.config.slug,
            config: collection.config
          }
        })
      })
    }
  }

  return filteredFields
} 