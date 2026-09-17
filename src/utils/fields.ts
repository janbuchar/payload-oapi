import type { Field } from 'payload'

export const isHiddenField = (field: Field | undefined) => {
  return field?.type !== 'ui' && Boolean(field?.hidden)
}
