import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { BasePayload, type CollectionConfig, type Config, type Payload, buildConfig } from 'payload'
import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { generateV30Spec } from '../src/openapi/generators'

const Posts: CollectionConfig = {
  slug: 'posts',
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

  const buildPayload = async (
    inputConfig: Omit<Config, 'db' | 'secret' | 'typescript'>,
  ): Promise<Payload> => {
    const config = await buildConfig({
      ...inputConfig,
      db: mongooseAdapter({
        url: mongo.getUri(),
      }),
      secret: '1234',
      typescript: {
        autoGenerate: false,
      },
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

    expect(spec).toMatchSnapshot()

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

    expect(spec).toMatchSnapshot()

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

    const spec = await generateV30Spec(
      { protocol: 'https', headers: new Headers({ host: 'localhost' }), payload },
      {
        openapiVersion: '3.0',
        authEndpoint: '/api/auth',
        metadata: { title: 'Test API', version: '1.0' },
      },
    )

    expect(spec).toMatchSnapshot()
  })

  test('handles block editor fields correctly', async () => {
    const Page: CollectionConfig = {
      slug: 'pages',
      fields: [
        {
          name: 'content',
          type: 'blocks',
          blocks: [
            {
              slug: 'pageContent',
              interfaceName: 'PageContentBlock',
              fields: [{ name: 'richText', type: 'richText', editor: lexicalEditor() }],
            },
          ],
        },
      ],
    }
    const payload = await buildPayload({
      collections: [Page],
    })

    const spec = await generateV30Spec(
      { protocol: 'https', headers: new Headers({ host: 'localhost' }), payload },
      {
        openapiVersion: '3.0',
        authEndpoint: '/api/auth',
        metadata: { title: 'Test API', version: '1.0' },
      },
    )

    expect(spec).toMatchSnapshot()
  })

  test('handles datetime field with timezones correctly', async () => {
    const Event: CollectionConfig = {
      slug: 'events',
      fields: [
        {
          name: 'startsAt',
          type: 'date',
          timezone: true,
        },
      ],
    }
    const payload = await buildPayload({
      collections: [Event],
    })

    const spec = await generateV30Spec(
      { protocol: 'https', headers: new Headers({ host: 'localhost' }), payload },
      {
        openapiVersion: '3.0',
        authEndpoint: '/api/auth',
        metadata: { title: 'Test API', version: '1.0' },
      },
    )

    expect(spec).toMatchSnapshot()
  })
})
