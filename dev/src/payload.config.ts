import { buildConfig } from 'payload/config'
import path from 'path'
import { Users } from './collections/Users'

export default buildConfig({
  serverURL: 'http://localhost:3000',
  collections: [Users],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  plugins: [],
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
