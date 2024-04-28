import { buildConfig } from 'payload/config'
import path from 'path'
import { Categories, Pets } from './collections/Pets'
import { Users } from './collections/Users'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { webpackBundler } from '@payloadcms/bundler-webpack'
import { slateEditor } from '@payloadcms/richtext-slate'
import { openapi, swaggerUI, redoc, rapidoc } from '../../src/index'
import { FeaturedPet } from './globals/FeaturedPet'

export default buildConfig({
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
    webpack: config => {
      const newConfig = {
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            ...(config?.resolve?.alias || {}),
            react: path.join(__dirname, '../node_modules/react'),
            'react-dom': path.join(__dirname, '../node_modules/react-dom'),
            payload: path.join(__dirname, '../node_modules/payload'),
          },
        },
      }
      return newConfig
    },
  },
  editor: slateEditor({}),
  collections: [Pets, Categories, Users],
  globals: [FeaturedPet],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  plugins: [
    openapi({ openapiVersion: '3.0', metadata: { title: 'Dev API', version: '0.0.1' } }),
    swaggerUI({ docsUrl: '/swagger-ui' }),
    redoc({ docsUrl: '/redoc' }),
    rapidoc({ docsUrl: '/rapidoc' }),
  ],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
})
