import { buildConfig } from 'payload/config'
import path from 'path'
import { Users } from './collections/Users'

import openapi from '../../src/plugin'

export default buildConfig({
  serverURL: 'http://localhost:3000',
  collections: [Users],
  cors: '*',
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  plugins: [openapi({ metadata: { title: 'Dev API', version: '0.0.1' } })],
  onInit: async payload => {
    await payload.create({
      collection: 'users',
      data: {
        email: 'dev@payloadcms.com',
        password: 'test',
      },
    })
  },
})
