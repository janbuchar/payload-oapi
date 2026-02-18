import type { Collection, SanitizedGlobalConfig } from 'payload'
import type { FilterOptions } from '../types.js'

export const shouldIncludeCollection = (
  collection: Collection,
  filters: FilterOptions,
): boolean => {
  const { slug } = collection.config

  if (filters.hideInternalCollections && slug.startsWith('payload-')) {
    return false
  }

  if (filters.excludeCollections?.includes(slug)) {
    return false
  }

  if (filters.includeCollections === undefined) {
    return true
  }

  return filters.includeCollections.includes(slug)
}

export const shouldIncludeGlobal = (
  global: SanitizedGlobalConfig,
  filters: FilterOptions,
): boolean => {
  const { slug } = global

  if (filters.excludeGlobals?.includes(slug)) {
    return false
  }

  if (filters.includeGlobals === undefined) {
    return true
  }

  return filters.includeGlobals.includes(slug)
}
