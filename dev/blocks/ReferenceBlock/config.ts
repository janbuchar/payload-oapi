import type { Block } from 'payload'

/**
 * @see https://github.com/janbuchar/payload-oapi/issues/59 blockReferences issue
 */
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
