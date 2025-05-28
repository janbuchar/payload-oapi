import type { Collection, SanitizedGlobalConfig } from 'payload'
import type { FilterFunction, SanitizedPluginOptions } from '../types.js'

/**
 * Filters collections based on include/exclude options
 */
export function filterCollections(
  collections: Record<string, Collection>,
  options: Pick<SanitizedPluginOptions, 'includeCollections' | 'excludeCollections'>
): Collection[] {
  const allCollections = Object.values(collections)
  
  let filteredCollections = allCollections

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