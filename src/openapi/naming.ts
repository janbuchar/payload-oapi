import type { Collection, SanitizedGlobalConfig } from 'payload'
import { camelize } from '../utils/strings.js'

export const collectionName = (collection: Collection): { singular: string; plural: string } => {
  const labels = collection.config.labels

  if (labels === undefined) {
    return { singular: collection.config.slug, plural: collection.config.slug }
  }

  const label = (value: typeof labels.singular): string => {
    if (typeof value === 'string') {
      return value
    }

    if (typeof value === 'function') {
      return collection.config.slug // TODO actually use the label function
    }

    return value['en'] ?? collection.config.slug
  }

  return { singular: label(labels.singular), plural: label(labels.plural) }
}

export const globalName = (global: SanitizedGlobalConfig): string => {
  if (global.label === undefined) {
    return global.slug
  }

  if (typeof global.label === 'string') {
    return global.label
  }

  if (typeof global.label === 'function') {
    return global.slug // TODO actually use the label function
  }

  return global.label['en']
}

export type ComponentType = 'schemas' | 'responses' | 'requestBodies'

export const componentName = (
  type: ComponentType,
  name: string,
  { prefix, suffix }: { suffix?: string; prefix?: string } = {},
): string => {
  name = camelize(name)

  if (prefix) {
    name = prefix + name
  }

  if (suffix) {
    name += suffix
  }

  if (type === 'responses') {
    name += 'Response'
  }

  if (type === 'requestBodies') {
    name += 'RequestBody'
  }

  return name
}
