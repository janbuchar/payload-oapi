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
      // `blockReferences` requires `blocks` to be present and empty until payload 4.0 merges them
      blocks: [],
      blockReferences: ['referenceBlock'],
    },
  ],
}
