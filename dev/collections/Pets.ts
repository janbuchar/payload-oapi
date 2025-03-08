import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'petCategories',
  access: {
    read: () => true,
  },
  fields: [{ name: 'name', type: 'text' }],
}

export const Pets: CollectionConfig = {
  slug: 'pets',
  access: {
    read: () => true,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'petCategories',
    },
    {
      name: 'status',
      type: 'radio',
      required: true,
      options: [
        { label: 'Available', value: 'available' },
        { label: 'Pending', value: 'pending' },
        { label: 'Sold', value: 'sold' },
      ],
    },
  ],
}
