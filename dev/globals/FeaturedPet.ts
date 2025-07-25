import { MediaBlock } from 'blocks/MediaBlock/config.js'
import type { GlobalConfig } from 'payload'

export const FeaturedPet: GlobalConfig = {
  slug: 'featuredPet',
  access: { read: () => true },
  fields: [
    { name: 'pet', type: 'relationship', relationTo: 'pets', required: true },
    { name: 'blurb', type: 'text' },

    {
      name: 'content',
      type: 'blocks',
      blocks: [MediaBlock],
    },
  ],
}
