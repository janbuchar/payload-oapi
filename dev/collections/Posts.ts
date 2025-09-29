import type { CollectionConfig } from 'payload'

import { MediaBlock } from '../blocks/MediaBlock/config.js'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'updatedAt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'blocks',
      blocks: [MediaBlock],
    },
    {
      name: 'contentRef',
      type: 'blocks',
      /**
       * Required to be empty, for compatibility reasons.
       * @see https://payloadcms.com/docs/fields/blocks#block-references blockReferences docs
       * @see https://github.com/janbuchar/payload-oapi/issues/59 blockReferences issue
       */
      blocks: [],
      blockReferences: ['ReferenceBlock'],
    },
  ],
}
