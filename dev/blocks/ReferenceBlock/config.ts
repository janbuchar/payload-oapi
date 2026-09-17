import type { Block } from 'payload'

export const ReferenceBlock: Block = {
  slug: 'referenceBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}
