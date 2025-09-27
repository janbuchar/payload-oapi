import type { CustomEndpointDocumentation } from '@payload-oapi'
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
    { name: 'lastUpdateAt', type: 'date', timezone: true },
  ],
  endpoints: [
    {
      handler: async () => {
        return Response.json({ message: 'Pet deleted successfully' })
      },
      method: 'delete',
      path: '/status/:status',
      custom: {
        openapi: {
          summary: 'Delete pets by status',
          description: 'Delete pets by status',
          parameters: [
            {
              name: 'status',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
                enum: ['available', 'pending', 'sold'],
              },
            },
          ],
          responses: {
            200: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'A message indicating the result of the operation',
                },
              },
            },
          },
        } as CustomEndpointDocumentation<'3.1'>,
      },
    },
    {
      handler: async () => {
        return Response.json({ message: 'Pet added successfully' })
      },
      method: 'post',
      path: '/status/:status',
      custom: {
        openapi: {
          summary: 'Add a new pet by status',
          description: 'Add a new pet by status',
          parameters: [
            {
              name: 'status',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
                enum: ['available', 'pending', 'sold'],
              },
            },
          ],
          requestBody: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the pet',
              },
            },
            required: ['name'],
          },
          responses: {
            200: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'A message indicating the result of the operation',
                },
              },
            },
          },
        } as CustomEndpointDocumentation<'3.1'>,
      },
    },
  ],
}
