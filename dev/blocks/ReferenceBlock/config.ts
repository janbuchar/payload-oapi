import type { Block } from 'payload'

export const ReferenceBlock: Block = {
  slug: 'ReferenceBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}
