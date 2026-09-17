import type { CollectionConfig } from 'payload'
import type { CustomEndpointDocumentation } from '../../src/types.js'

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
    { name: 'lastUpdateAt', type: 'date', timezone: true },
  ],
  endpoints: [
    {
      path: '/by-status/:status',
      method: 'get',
      handler: async req => {
        const status = req.routeParams?.status
        const { docs } = await req.payload.find({
          collection: 'pets',
          where: { status: { equals: status } },
        })

        return Response.json(docs)
      },
      custom: {
        openapi: {
          summary: 'List pets by status',
          security: [],
          parameters: [
            {
              in: 'path',
              name: 'status',
              required: true,
              schema: { enum: ['available', 'pending', 'sold'] },
            },
          ],
          responses: {
            200: {
              description: 'Pets with the requested status',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Pet' } },
                },
              },
            },
          },
        } satisfies CustomEndpointDocumentation,
      },
    },
  ],
}
