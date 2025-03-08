import type { GlobalConfig } from 'payload/types'

export const FeaturedPet: GlobalConfig = {
  slug: 'featuredPet',
  access: { read: () => true },
  fields: [
    { name: 'pet', type: 'relationship', relationTo: 'pets', required: true },
    { name: 'blurb', type: 'text' },
  ],
}
