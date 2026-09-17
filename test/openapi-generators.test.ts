import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import type { OpenAPIV3 } from 'openapi-types'
import {
  BasePayload,
  buildConfig,
  type CollectionConfig,
  type Config,
  type GlobalConfig,
  type Payload,
} from 'payload'
import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { generateV30Spec } from '../src/openapi/generators'

const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [{ type: 'text', name: 'title' }],
}

/**
 * Paths Payload serves for an auth collection under the default auth config: no `verify`, so no
 * `/verify/{id}`, but `maxLoginAttempts` defaults above zero, so `/unlock` is real.
 */
const authPaths = (apiRoute: string, slug: string): Array<string> => [
  `${apiRoute}/${slug}/login`,
  `${apiRoute}/${slug}/logout`,
  `${apiRoute}/${slug}/me`,
  `${apiRoute}/${slug}/refresh-token`,
  `${apiRoute}/${slug}/forgot-password`,
  `${apiRoute}/${slug}/reset-password`,
  `${apiRoute}/${slug}/first-register`,
  `${apiRoute}/${slug}/unlock`,
  `${apiRoute}/${slug}/init`,
  `${apiRoute}/access`,
]

describe('openapi generators', () => {
  let mongo: MongoMemoryServer

  beforeAll(() => {
    process.env.DISABLE_PAYLOAD_HMR = 'true'
  })

  beforeEach(async () => {
    mongo = await MongoMemoryServer.create()
  })

  const buildPayload = async (
    inputConfig: Omit<Config, 'db' | 'secret' | 'typescript'> & Partial<Config>,
  ): Promise<Payload> => {
    const config = await buildConfig({
      db: mongooseAdapter({
        url: mongo.getUri(),
      }),
      secret: '1234',
      typescript: {
        autoGenerate: false,
      },
      ...inputConfig,
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
        authEndpoint: '/auth',
        metadata: { title: 'Test API', version: '1.0' },
        filters: {},
        apiBasePath: null,
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
        ...authPaths('/api', 'users'),
      ]),
    )
  })

  test('handles non-default api route', async () => {
    const payload = await buildPayload({
      collections: [Posts],
      routes: {
        api: '/payload-api',
      },
    })

    const spec = await generateV30Spec(
      { protocol: 'https', headers: new Headers({ host: 'localhost' }), payload },
      {
        openapiVersion: '3.0',
        authEndpoint: '/auth',
        metadata: { title: 'Test API', version: '1.0' },
        filters: {},
        apiBasePath: null,
      },
    )

    expect(spec).toMatchSnapshot()

    expect(new Set(Object.keys(spec.paths))).toEqual(
      new Set([
        '/payload-api/posts',
        '/payload-api/posts/{id}',
        '/payload-api/users',
        '/payload-api/users/{id}',
        '/payload-api/payload-locked-documents',
        '/payload-api/payload-locked-documents/{id}',
        '/payload-api/payload-preferences',
        '/payload-api/payload-preferences/{id}',
        '/payload-api/payload-migrations',
        '/payload-api/payload-migrations/{id}',
        ...authPaths('/payload-api', 'users'),
      ]),
    )

    const apiKey = spec.components?.securitySchemes?.ApiKey as OpenAPIV3.OAuth2SecurityScheme
    expect(apiKey.flows.password?.tokenUrl).toBe('/payload-api/auth')
  })

  test('apiBasePath overrides the api route', async () => {
    const payload = await buildPayload({
      collections: [Posts],
      routes: {
        api: '/payload-api',
      },
    })

    const spec = await generateV30Spec(
      { protocol: 'https', headers: new Headers({ host: 'localhost' }), payload },
      {
        openapiVersion: '3.0',
        authEndpoint: '/auth',
        metadata: { title: 'Test API', version: '1.0' },
        filters: { hideInternalCollections: true },
        apiBasePath: '/proxied',
      },
    )

    expect(new Set(Object.keys(spec.paths))).toEqual(
      new Set([
        '/proxied/posts',
        '/proxied/posts/{id}',
        '/proxied/users',
        '/proxied/users/{id}',
        ...authPaths('/proxied', 'users'),
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
        authEndpoint: '/auth',
        metadata: { title: 'Test API', version: '1.0' },
        filters: {},
        apiBasePath: null,
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
        ...authPaths('/api', 'users'),
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
        authEndpoint: '/auth',
        metadata: { title: 'Test API', version: '1.0' },
        filters: {},
        apiBasePath: null,
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
        authEndpoint: '/auth',
        metadata: { title: 'Test API', version: '1.0' },
        filters: {},
        apiBasePath: null,
      },
    )

    expect(spec).toMatchSnapshot()
  })

  test('handles blocks referenced from the config', async () => {
    const Page: CollectionConfig = {
      slug: 'pages',
      fields: [
        {
          name: 'content',
          type: 'blocks',
          blocks: [],
          blockReferences: ['contentBlock'],
        },
      ],
    }
    const payload = await buildPayload({
      blocks: [
        {
          slug: 'contentBlock',
          fields: [
            { name: 'heading', type: 'text', required: true },
            { name: 'internalNote', type: 'text', hidden: true },
          ],
        },
      ],
      collections: [Page],
    })

    const spec = await generateV30Spec(
      { protocol: 'https', headers: new Headers({ host: 'localhost' }), payload },
      {
        openapiVersion: '3.0',
        authEndpoint: '/auth',
        metadata: { title: 'Test API', version: '1.0' },
        filters: {},
        apiBasePath: null,
      },
    )

    expect(spec).toMatchSnapshot()

    const block = spec.components?.schemas?.ContentBlock as OpenAPIV3.SchemaObject
    expect(block.properties?.internalNote).toBeUndefined()
    // payload assigns block ids itself, so a write payload must not be required to carry one
    expect(block.required).toEqual(['blockType', 'heading'])

    const page = spec.components?.schemas?.Page as OpenAPIV3.SchemaObject
    const content = page.properties?.content as OpenAPIV3.ArraySchemaObject
    expect(content.items).toEqual({ oneOf: [{ $ref: '#/components/schemas/ContentBlock' }] })
  })

  test('rejects a block whose schema name collides with a collection', async () => {
    const payload = await buildPayload({
      blocks: [{ slug: 'page', fields: [{ name: 'heading', type: 'text' }] }],
      collections: [
        {
          slug: 'pages',
          fields: [{ name: 'content', type: 'blocks', blocks: [], blockReferences: ['page'] }],
        },
      ],
    })

    await expect(
      generateV30Spec(
        { protocol: 'https', headers: new Headers({ host: 'localhost' }), payload },
        {
          openapiVersion: '3.0',
          authEndpoint: '/auth',
          metadata: { title: 'Test API', version: '1.0' },
          filters: {},
          apiBasePath: null,
        },
      ),
    ).rejects.toThrow('Duplicate OpenAPI schema name "Page"')
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
        authEndpoint: '/auth',
        metadata: { title: 'Test API', version: '1.0' },
        filters: {},
        apiBasePath: null,
      },
    )

    expect(spec).toMatchSnapshot()
  })

  test('respects default ID type from db adapter', async () => {
    const payload = await buildPayload({
      // SQLite defaults to numeric IDs, mongo to text
      db: sqliteAdapter({
        client: { url: ':memory:' },
      }),
      collections: [Posts],
    })

    const spec = await generateV30Spec(
      { protocol: 'https', headers: new Headers({ host: 'localhost' }), payload },
      {
        openapiVersion: '3.0',
        authEndpoint: '/auth',
        metadata: { title: 'Test API', version: '1.0' },
      },
    )

    expect(spec).toMatchSnapshot()

    const post = spec.components?.schemas?.Post as OpenAPIV3.SchemaObject
    expect(post.properties?.id).toEqual({ type: 'number' })
    expect(spec.paths['/api/posts/{id}']?.parameters).toContainEqual(
      expect.objectContaining({ name: 'id', schema: { type: 'number' } }),
    )
  })

  describe('definitions added through `typescript.schema`', () => {
    // Mirrors `payload-phone-number-plugin`: the field refers to a definition the plugin registers
    // separately, and accepts a plain string on write.
    const Contacts: CollectionConfig = {
      slug: 'contacts',
      fields: [
        {
          type: 'text',
          name: 'phone',
          typescriptSchema: [
            () => ({ anyOf: [{ type: 'string' }, { $ref: '#/definitions/PhoneNumber' }] }),
          ],
        },
      ],
    }

    const phoneNumberSchema = (definitions: Record<string, unknown>): Config['typescript'] => ({
      autoGenerate: false,
      schema: [
        ({ jsonSchema }) => {
          jsonSchema.definitions = { ...jsonSchema.definitions, ...definitions }
          return jsonSchema
        },
      ],
    })

    const phoneNumber = {
      title: 'PhoneNumber',
      type: 'object',
      properties: {
        e164: { type: 'string' },
        regionCode: { type: 'string' },
      },
      required: ['e164', 'regionCode'],
      additionalProperties: false,
    }

    const generate = async (payload: Payload, filters = {}): Promise<OpenAPIV3.Document> =>
      await generateV30Spec(
        { protocol: 'https', headers: new Headers({ host: 'localhost' }), payload },
        {
          openapiVersion: '3.0',
          authEndpoint: '/auth',
          metadata: { title: 'Test API', version: '1.0' },
          filters,
          apiBasePath: null,
        },
      )

    test('lifts a referenced definition into components verbatim', async () => {
      const payload = await buildPayload({
        collections: [Contacts],
        typescript: phoneNumberSchema({ PhoneNumber: phoneNumber }),
      })

      const spec = await generate(payload)

      expect(spec.components?.schemas?.PhoneNumber).toEqual({
        title: 'PhoneNumber',
        type: 'object',
        properties: { e164: { type: 'string' }, regionCode: { type: 'string' } },
        required: ['e164', 'regionCode'],
        additionalProperties: false,
      })

      const contact = spec.components?.schemas?.Contact as OpenAPIV3.SchemaObject
      expect(contact.properties?.phone).toEqual({
        anyOf: [{ type: 'string' }, { $ref: '#/components/schemas/PhoneNumber' }],
      })
    })

    test('follows refs nested inside a lifted definition', async () => {
      const payload = await buildPayload({
        collections: [Contacts],
        typescript: phoneNumberSchema({
          PhoneNumber: {
            type: 'object',
            properties: { region: { $ref: '#/definitions/PhoneRegion' } },
          },
          PhoneRegion: { type: 'string', enum: ['NO', 'CZ'] },
        }),
      })

      const spec = await generate(payload)

      expect(spec.components?.schemas?.PhoneRegion).toEqual({ type: 'string', enum: ['NO', 'CZ'] })
      expect(
        (spec.components?.schemas?.PhoneNumber as OpenAPIV3.SchemaObject).properties?.region,
      ).toEqual({ $ref: '#/components/schemas/PhoneRegion' })
    })

    test('omits a definition once nothing references it', async () => {
      const payload = await buildPayload({
        collections: [Contacts],
        typescript: phoneNumberSchema({ PhoneNumber: phoneNumber }),
      })

      const spec = await generate(payload, { excludeCollections: ['contacts'] })

      expect(JSON.stringify(spec)).not.toContain('PhoneNumber')
    })

    test('rejects a ref with no definition behind it', async () => {
      const payload = await buildPayload({ collections: [Contacts] })

      await expect(generate(payload)).rejects.toThrow('Unknown reference: PhoneNumber')
    })
  })

  describe('auth endpoints', () => {
    const specFor = async (collections: Array<CollectionConfig>) => {
      const payload = await buildPayload({ collections })

      return await generateV30Spec(
        { protocol: 'https', headers: new Headers({ host: 'localhost' }), payload },
        {
          openapiVersion: '3.0',
          authEndpoint: '/auth',
          metadata: { title: 'Test API', version: '1.0' },
          filters: { hideInternalCollections: true },
          apiBasePath: null,
        },
      )
    }

    /** Resolves a `#/components/<type>/<name>` pointer, so assertions never guess component names. */
    const follow = <T>(spec: OpenAPIV3.Document, target: unknown): T => {
      const { $ref } = target as OpenAPIV3.ReferenceObject
      const [, , type, name] = $ref.split('/')
      const components = spec.components as unknown as Record<string, Record<string, T>>

      expect(components[type]?.[name]).toBeDefined()

      return components[type][name]
    }

    const responseSchema = (spec: OpenAPIV3.Document, path: string, method: 'get' | 'post') => {
      const operation = spec.paths[path]?.[method]
      const response = follow<OpenAPIV3.ResponseObject>(spec, operation?.responses['200'])

      return follow<OpenAPIV3.NonArraySchemaObject>(
        spec,
        response.content?.['application/json']?.schema,
      )
    }

    test('collections without auth get no auth operations', async () => {
      const spec = await specFor([Posts])

      expect(spec.paths['/api/posts/login']).toBeUndefined()
      expect(spec.paths['/api/posts/me']).toBeUndefined()
      expect(spec.paths['/api/users/login']).toBeDefined()
    })

    test('me is a GET, matching the route Payload registers', async () => {
      const spec = await specFor([Posts])

      expect(Object.keys(spec.paths['/api/users/me'] ?? {})).toEqual(['get'])
      expect(Object.keys(spec.paths['/api/users/logout'] ?? {})).toEqual(['post'])
    })

    test('authenticated operations require the api key, public ones do not', async () => {
      const spec = await specFor([Posts])

      expect(spec.paths['/api/users/me']?.get?.security).toEqual([{ ApiKey: [] }])
      expect(spec.paths['/api/users/refresh-token']?.post?.security).toEqual([{ ApiKey: [] }])
      expect(spec.paths['/api/users/login']?.post?.security).toEqual([])
      expect(spec.paths['/api/users/forgot-password']?.post?.security).toEqual([])
    })

    test('disableLocalStrategy drops the password-based operations', async () => {
      const spec = await specFor([
        { slug: 'users', auth: { disableLocalStrategy: true }, fields: [] },
      ])

      expect(spec.paths['/api/users/login']).toBeUndefined()
      expect(spec.paths['/api/users/forgot-password']).toBeUndefined()
      expect(spec.paths['/api/users/reset-password']).toBeUndefined()
      expect(spec.paths['/api/users/first-register']).toBeUndefined()
      expect(spec.paths['/api/users/unlock']).toBeUndefined()
      // Cookie-based operations survive - a custom strategy still issues and clears them.
      expect(spec.paths['/api/users/me']).toBeDefined()
      expect(spec.paths['/api/users/logout']).toBeDefined()
    })

    test('unlock is documented only when lockout is enabled', async () => {
      const spec = await specFor([{ slug: 'users', auth: { maxLoginAttempts: 0 }, fields: [] }])

      expect(spec.paths['/api/users/unlock']).toBeUndefined()
      expect(spec.paths['/api/users/login']).toBeDefined()
    })

    test('verify is documented only when email verification is enabled', async () => {
      const spec = await specFor([{ slug: 'users', auth: { verify: true }, fields: [] }])

      expect(spec.paths['/api/users/verify/{id}']?.post).toBeDefined()
    })

    test('login body follows loginWithUsername', async () => {
      const spec = await specFor([
        {
          slug: 'users',
          auth: { loginWithUsername: { allowEmailLogin: false, requireUsername: true } },
          fields: [],
        },
      ])

      const body = follow<OpenAPIV3.RequestBodyObject>(
        spec,
        spec.paths['/api/users/login']?.post?.requestBody,
      )
      const schema = body.content['application/json'].schema as OpenAPIV3.NonArraySchemaObject

      expect(Object.keys(schema.properties ?? {})).toEqual(['username', 'password'])
      expect(schema.required).toEqual(['username', 'password'])
    })

    test('login accepts either identifier when both are allowed', async () => {
      const spec = await specFor([
        { slug: 'users', auth: { loginWithUsername: { allowEmailLogin: true } }, fields: [] },
      ])

      const body = follow<OpenAPIV3.RequestBodyObject>(
        spec,
        spec.paths['/api/users/login']?.post?.requestBody,
      )
      const schema = body.content['application/json'].schema as OpenAPIV3.NonArraySchemaObject

      expect(schema.required).toEqual(['password'])
      expect(schema.anyOf).toEqual([{ required: ['email'] }, { required: ['username'] }])
    })

    test('auth responses reference the collection schema rather than a generic user', async () => {
      const spec = await specFor([Posts])

      const login = responseSchema(spec, '/api/users/login', 'post')
      const collection = follow<OpenAPIV3.NonArraySchemaObject>(spec, login.properties?.user)

      expect(collection.title).toBe('users')
      expect(collection.properties?.email).toBeDefined()
    })

    test('removeTokenFromResponses omits the token it does not return', async () => {
      const spec = await specFor([
        { slug: 'users', auth: { removeTokenFromResponses: true }, fields: [] },
      ])

      const login = responseSchema(spec, '/api/users/login', 'post')
      const refresh = responseSchema(spec, '/api/users/refresh-token', 'post')

      expect(login.properties?.token).toBeUndefined()
      expect(refresh.properties?.refreshedToken).toBeUndefined()
    })

    test('the message response shape is defined once, not per collection', async () => {
      const spec = await specFor([
        { slug: 'admins', auth: true, fields: [] },
        { slug: 'editors', auth: true, fields: [] },
      ])

      const shared = { $ref: '#/components/responses/AuthMessageResponse' }

      expect(spec.paths['/api/admins/logout']?.post?.responses['200']).toEqual(shared)
      expect(spec.paths['/api/editors/logout']?.post?.responses['200']).toEqual(shared)
      expect(spec.components?.schemas?.AuthMessage).toBeDefined()
    })

    test('access is emitted once, not per auth collection', async () => {
      const spec = await specFor([
        { slug: 'admins', auth: true, fields: [] },
        { slug: 'editors', auth: true, fields: [] },
      ])

      expect(spec.paths['/api/access']?.get).toBeDefined()
      expect(spec.paths['/api/admins/access']).toBeUndefined()
    })
  })

  describe('collection filtering', () => {
    test('includeCollections filters to specified collections only', async () => {
      const Categories: CollectionConfig = {
        slug: 'categories',
        fields: [{ type: 'text', name: 'name' }],
      }
      const payload = await buildPayload({
        collections: [Posts, Categories],
      })

      const spec = await generateV30Spec(
        { protocol: 'https', headers: new Headers({ host: 'localhost' }), payload },
        {
          openapiVersion: '3.0',
          authEndpoint: '/auth',
          metadata: { title: 'Test API', version: '1.0' },
          filters: { includeCollections: ['posts'] },
          apiBasePath: null,
        },
      )

      expect(new Set(Object.keys(spec.paths))).toEqual(new Set(['/api/posts', '/api/posts/{id}']))
      expect(spec.paths['/api/categories']).toBeUndefined()
    })

    test('excludeCollections excludes specified collections', async () => {
      const payload = await buildPayload({
        collections: [Posts],
      })

      const spec = await generateV30Spec(
        { protocol: 'https', headers: new Headers({ host: 'localhost' }), payload },
        {
          openapiVersion: '3.0',
          authEndpoint: '/auth',
          metadata: { title: 'Test API', version: '1.0' },
          filters: { excludeCollections: ['users'] },
          apiBasePath: null,
        },
      )

      expect(spec.paths['/api/posts']).toBeDefined()
      expect(spec.paths['/api/users']).toBeUndefined()
    })

    test('hideInternalCollections removes payload-* collections from spec', async () => {
      const payload = await buildPayload({
        collections: [Posts],
      })

      const spec = await generateV30Spec(
        { protocol: 'https', headers: new Headers({ host: 'localhost' }), payload },
        {
          openapiVersion: '3.0',
          authEndpoint: '/auth',
          metadata: { title: 'Test API', version: '1.0' },
          filters: { hideInternalCollections: true },
          apiBasePath: null,
        },
      )

      expect(spec.paths['/api/posts']).toBeDefined()
      expect(spec.paths['/api/payload-preferences']).toBeUndefined()
      expect(spec.paths['/api/payload-migrations']).toBeUndefined()
      expect(spec.paths['/api/payload-locked-documents']).toBeUndefined()
    })

    test('empty includeCollections array results in no collections', async () => {
      const payload = await buildPayload({
        collections: [Posts],
      })

      const spec = await generateV30Spec(
        { protocol: 'https', headers: new Headers({ host: 'localhost' }), payload },
        {
          openapiVersion: '3.0',
          authEndpoint: '/auth',
          metadata: { title: 'Test API', version: '1.0' },
          filters: { includeCollections: [] },
          apiBasePath: null,
        },
      )

      expect(Object.keys(spec.paths).filter(path => path.startsWith('/api/'))).toEqual([])
    })
  })

  describe('global filtering', () => {
    test('includeGlobals filters to specified globals only', async () => {
      const Settings: GlobalConfig = {
        slug: 'settings',
        fields: [{ type: 'text', name: 'siteName' }],
      }
      const Footer: GlobalConfig = {
        slug: 'footer',
        fields: [{ type: 'text', name: 'copyright' }],
      }
      const payload = await buildPayload({
        globals: [Settings, Footer],
      })

      const spec = await generateV30Spec(
        { protocol: 'https', headers: new Headers({ host: 'localhost' }), payload },
        {
          openapiVersion: '3.0',
          authEndpoint: '/auth',
          metadata: { title: 'Test API', version: '1.0' },
          filters: { includeGlobals: ['settings'] },
          apiBasePath: null,
        },
      )

      expect(spec.paths['/api/globals/settings']).toBeDefined()
      expect(spec.paths['/api/globals/footer']).toBeUndefined()
    })

    test('excludeGlobals excludes specified globals', async () => {
      const Settings: GlobalConfig = {
        slug: 'settings',
        fields: [{ type: 'text', name: 'siteName' }],
      }
      const Footer: GlobalConfig = {
        slug: 'footer',
        fields: [{ type: 'text', name: 'copyright' }],
      }
      const payload = await buildPayload({
        globals: [Settings, Footer],
      })

      const spec = await generateV30Spec(
        { protocol: 'https', headers: new Headers({ host: 'localhost' }), payload },
        {
          openapiVersion: '3.0',
          authEndpoint: '/auth',
          metadata: { title: 'Test API', version: '1.0' },
          filters: { excludeGlobals: ['footer'] },
          apiBasePath: null,
        },
      )

      expect(spec.paths['/api/globals/settings']).toBeDefined()
      expect(spec.paths['/api/globals/footer']).toBeUndefined()
    })
  })
})
