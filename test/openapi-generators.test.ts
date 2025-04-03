import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { BasePayload, type CollectionConfig, type Config, type Payload, buildConfig } from 'payload'
import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { generateV30Spec } from '../src/openapi/generators'

const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
  },
  fields: [{ type: 'text', name: 'title' }],
}

describe('openapi generators', () => {
  let mongo: MongoMemoryServer

  beforeAll(() => {
    process.env.DISABLE_PAYLOAD_HMR = 'true'
  })

  beforeEach(async () => {
    mongo = await MongoMemoryServer.create()
  })

  const buildPayload = async (inputConfig: Omit<Config, 'db' | 'secret'>): Promise<Payload> => {
    const config = await buildConfig({
      ...inputConfig,
      db: mongooseAdapter({
        url: mongo.getUri(),
      }),
      secret: '1234',
    })

    return await new BasePayload().init({ config })
  }

  afterEach(async () => {
    for (const modelName of mongoose.modelNames()) {
      mongoose.deleteModel(modelName)
    }
    await mongo.stop()
  })

  test('converts empty config correctly', async () => {
    const payload = await buildPayload({})

    const spec = await generateV30Spec(
      { protocol: 'https', headers: new Headers({ host: 'localhost' }), payload },
      {
        openapiVersion: '3.0',
        authEndpoint: '/api/auth',
        metadata: { title: 'Test API', version: '1.0' },
      },
    )

    expect(new Set(Object.keys(spec.paths))).toEqual(
      new Set([
        '/api/users',
        '/api/users/{id}',
        '/api/payload-locked-documents',
        '/api/payload-locked-documents/{id}',
        '/api/payload-preferences',
        '/api/payload-preferences/{id}',
        '/api/payload-migrations',
        '/api/payload-migrations/{id}',
      ]),
    )
  })

  test('handles non-default collection', async () => {
    const payload = await buildPayload({
      collections: [Posts],
    })

    const spec = await generateV30Spec(
      { protocol: 'https', headers: new Headers({ host: 'localhost' }), payload },
      {
        openapiVersion: '3.0',
        authEndpoint: '/api/auth',
        metadata: { title: 'Test API', version: '1.0' },
      },
    )

    expect(new Set(Object.keys(spec.paths))).toEqual(
      new Set([
        '/api/posts',
        '/api/posts/{id}',
        '/api/users',
        '/api/users/{id}',
        '/api/payload-locked-documents',
        '/api/payload-locked-documents/{id}',
        '/api/payload-preferences',
        '/api/payload-preferences/{id}',
        '/api/payload-migrations',
        '/api/payload-migrations/{id}',
      ]),
    )
  })

  test('handles interfaceName correctly', async () => {
    const Users: CollectionConfig = {
      slug: 'users',
      admin: {
        useAsTitle: 'email',
      },
      auth: true,
      fields: [
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
    const payload = await buildPayload({
      collections: [Users],
    })

    await generateV30Spec(
      { protocol: 'https', headers: new Headers({ host: 'localhost' }), payload },
      {
        openapiVersion: '3.0',
        authEndpoint: '/api/auth',
        metadata: { title: 'Test API', version: '1.0' },
      },
    )
  })
})
