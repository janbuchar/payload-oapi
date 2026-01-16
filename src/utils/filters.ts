import type { Collection, SanitizedGlobalConfig } from 'payload'
import type { PluginOptions } from '../types.js'

export const shouldIncludeCollection = (
  collection: Collection,
  options: PluginOptions,
): boolean => {
  const { slug } = collection.config

  if (options.hideInternalCollections && slug.startsWith('payload-')) {
    return false
  }

  if (options.excludeCollections?.includes(slug)) {
    return false
  }

  if (options.includeCollections !== undefined) {
    return options.includeCollections.includes(slug)
  }

  return true
}

export const shouldIncludeGlobal = (
  global: SanitizedGlobalConfig,
  options: PluginOptions,
): boolean => {
  const { slug } = global

  if (options.excludeGlobals?.includes(slug)) {
    return false
  }

  if (options.includeGlobals !== undefined) {
    return options.includeGlobals.includes(slug)
  }

  return true
}
