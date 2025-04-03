import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  access: {
    read: () => true,
  },
  fields: [
    { name: 'firstName', type: 'text' },
    { name: 'lastName', type: 'text' },
    {
      type: 'array',
      interfaceName: 'roles',
      name: 'roles',
      fields: [
        {
          type: 'text',
          name: 'name',
        },
      ],
    },
  ],
}
