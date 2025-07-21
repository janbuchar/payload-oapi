import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { openapi, rapidoc, redoc, swaggerUI } from '@payload-oapi'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { testEmailAdapter } from './helpers/testEmailAdapter.js'
import { seed } from './seed.js'

import { Categories, Pets } from './collections/Pets.js'
import { Posts } from './collections/Posts.js'
import { Users } from './collections/Users.js'
import { FeaturedPet } from './globals/FeaturedPet.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Posts,
    Pets,
    Categories,
    Users,
    {
      slug: 'media',
      fields: [],
      upload: {
        staticDir: path.resolve(dirname, 'media'),
      },
    },
  ],
  globals: [FeaturedPet],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  editor: lexicalEditor(),
  email: testEmailAdapter,
  onInit: async payload => {
    await seed(payload)
  },
  plugins: [
    openapi({ openapiVersion: '3.0', metadata: { title: 'Dev API', version: '0.0.1' } }),
    swaggerUI({ docsUrl: '/swagger-ui' }),
    redoc({ docsUrl: '/redoc' }),
    rapidoc({ docsUrl: '/rapidoc' }),
  ],
  secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
