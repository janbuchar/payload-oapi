import type { Field, FlattenedField } from 'payload'

export const isHiddenField = (field: Field | FlattenedField | undefined) => {
  return field?.type !== 'ui' && Boolean(field?.hidden)
}
