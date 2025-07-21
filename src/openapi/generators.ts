import _jsonSchemaToOpenapiSchema from '@openapi-contrib/json-schema-to-openapi-schema'
import type { JSONSchema4 } from 'json-schema'
import { create } from 'mutative'
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import type {
  Access,
  AccessArgs,
  Collection,
  Field,
  FieldBase,
  PayloadRequest,
  RadioField,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
  SelectField,
} from 'payload'
import { entityToJSONSchema } from 'payload'
import type { SanitizedPluginOptions } from '../types.js'
import { mapValuesAsync, visitObjectNodes } from '../utils/objects.js'
import { type ComponentType, collectionName, componentName, globalName } from './naming.js'
import { apiKeySecurity, generateSecuritySchemes } from './securitySchemes.js'

const baseQueryParams: Array<OpenAPIV3.ParameterObject & OpenAPIV3_1.ParameterObject> = [
  { in: 'query', name: 'depth', schema: { type: 'number' } },
  { in: 'query', name: 'locale', schema: { type: 'string' } },
  { in: 'query', name: 'fallback-locale', schema: { type: 'string' } },
]

async function jsonSchemaToOpenapiSchema(schema: JSONSchema4): Promise<OpenAPIV3.Document> {
  return await (_jsonSchemaToOpenapiSchema as any)(schema)
}

const adjustRefTargets = (
  payload: PayloadRequest['payload'],
  spec: Record<string, unknown>,
): void => {
  const search = /^#\/definitions\/(.*)/

  visitObjectNodes(spec, (subject, key, value) => {
    const isRef = key === '$ref' && typeof value === 'string'

    if (!isRef) {
      return
    }

    subject[key] = value.replace(search, (_match, name: string) => {
      if (name === 'supportedTimezones') {
        return '#/components/schemas/supportedTimezones'
      }

      const collection = payload.collections[name]
      if (collection !== undefined) {
        name = collectionName(payload.collections[name]).singular
        return `#/components/schemas/${componentName('schemas', name)}`
      }

      const global = payload.globals.config.find(({ slug }) => slug === name)
      if (global !== undefined) {
        return `#/components/schemas/${componentName('schemas', globalName(global))}`
      }

      throw new Error(`Unknown reference: ${name}`)
    })
  })
}

const removeInterfaceNames = (target: SanitizedCollectionConfig | SanitizedGlobalConfig) =>
  create(target, draft =>
    visitObjectNodes(draft, (subject, key) => {
      if (key === 'interfaceName') {
        subject[key] = undefined
      }
    }),
  )

const composeRef = (
  type: ComponentType,
  name: string,
  options?: { suffix?: string; prefix?: string },
): OpenAPIV3_1.ReferenceObject & OpenAPIV3.ReferenceObject => ({
  $ref: `#/components/${type}/${componentName(type, name, options)}`,
})

const generateSchemaObject = (config: SanitizedConfig, collection: Collection): JSONSchema4 => {
  const schema = entityToJSONSchema(
    config,
    removeInterfaceNames(collection.config), // the `interfaceName` option causes `entityToJSONSchema` to add a reference to a non-existing schema
    new Map(),
    'text',
    undefined,
  )

  return {
    ...schema,
    title: collectionName(collection).singular,
  }
}

const requestBodySchema = (fields: Array<Field>, schema: JSONSchema4): JSONSchema4 => ({
  ...schema,
  properties: Object.fromEntries(
    Object.entries(schema.properties ?? {})
      .filter(([slug]) => !['id', 'createdAt', 'updatedAt'].includes(slug))
      .map(([fieldName, schema]) => {
        const field = fields.find(field => (field as FieldBase).name === fieldName)
        if (field?.type === 'relationship') {
          const target = Array.isArray(field.relationTo) ? field.relationTo : [field.relationTo]
          return [fieldName, { type: 'string', description: `ID of the ${target.join('/')}` }]
        }

        return [fieldName, schema]
      }),
  ),
})

const generateRequestBodySchema = (
  config: SanitizedConfig,
  collection: Collection,
): OpenAPIV3_1.RequestBodyObject => {
  const schema = entityToJSONSchema(
    config,
    removeInterfaceNames(collection.config), // the `interfaceName` option causes `entityToJSONSchema` to add a reference to a non-existing schema
    new Map(),
    'text',
    undefined,
  )
  return {
    description: collectionName(collection).singular,
    content: {
      'application/json': {
        schema: requestBodySchema(collection.config.fields, schema) as OpenAPIV3_1.SchemaObject,
      },
    },
  }
}

const generateQueryOperationSchemas = (collection: Collection): Record<string, JSONSchema4> => {
  const { singular } = collectionName(collection)

  return {
    [componentName('schemas', singular, { suffix: 'QueryOperations' })]: {
      title: `${singular} query operations`,
      type: 'object',
      properties: Object.fromEntries(
        (
          collection.config.fields.filter(({ type }) =>
            ['number', 'text', 'email', 'date', 'radio', 'checkbox', 'select'].includes(type),
          ) as Array<
            FieldBase & {
              type: 'number' | 'text' | 'email' | 'date' | 'radio' | 'select' | 'checkbox'
            }
          >
        ).map(field => {
          const comparedValueSchema = (() => {
            switch (field.type) {
              case 'number':
                return { type: 'number' } as const
              case 'text':
                return { type: 'string' } as const
              case 'email':
                return { type: 'string', format: 'email' } as const
              case 'date':
                return { type: 'string', format: 'date-time' } as const
              case 'checkbox':
                return { type: 'boolean' } as const
              case 'radio':
              case 'select':
                return {
                  type: 'string',
                  enum: (field as RadioField | SelectField).options.map(it =>
                    typeof it === 'string' ? it : it.value,
                  ),
                } as const
            }
          })()

          const properties: Record<string, JSONSchema4> = {
            ['equals']: comparedValueSchema,
            ['not_equals']: comparedValueSchema,
            ['in']: { type: 'string' },
            ['not_in']: { type: 'string' },
          }

          if (field.type === 'text') {
            properties['like'] = comparedValueSchema
          }

          if (field.type === 'text' || field.type === 'email') {
            properties['contains'] = comparedValueSchema
          }

          if (field.type === 'number' || field.type === 'date') {
            properties['greater_than'] = comparedValueSchema
            properties['greater_than_equal'] = comparedValueSchema
            properties['less_than'] = comparedValueSchema
            properties['less_than_equal'] = comparedValueSchema
          }

          return [
            field.name,
            {
              type: 'object',
              properties,
            },
          ]
        }),
      ),
    },
    [componentName('schemas', singular, { suffix: 'QueryOperationsAnd' })]: {
      title: `${singular} query conjunction`,
      type: 'object',
      properties: {
        and: {
          type: 'array',
          items: {
            anyOf: [
              composeRef('schemas', singular, { suffix: 'QueryOperations' }),
              composeRef('schemas', singular, { suffix: 'QueryOperationsAnd' }),
              composeRef('schemas', singular, { suffix: 'QueryOperationsOr' }),
            ],
          },
        },
      },
      required: ['and'],
    },

    [componentName('schemas', singular, { suffix: 'QueryOperationsOr' })]: {
      title: `${singular} query disjunction`,
      type: 'object',
      properties: {
        or: {
          type: 'array',
          items: {
            anyOf: [
              composeRef('schemas', singular, { suffix: 'QueryOperations' }),
              composeRef('schemas', singular, { suffix: 'QueryOperationsAnd' }),
              composeRef('schemas', singular, { suffix: 'QueryOperationsOr' }),
            ],
          },
        },
      },
      required: ['or'],
    },
  }
}

const generateCollectionResponses = (
  collection: Collection,
): Record<string, OpenAPIV3_1.ResponseObject & OpenAPIV3.ResponseObject> => {
  const { singular, plural } = collectionName(collection)

  return {
    [componentName('responses', singular)]: {
      description: `${singular} object`,
      content: {
        'application/json': {
          schema: composeRef('schemas', singular),
        },
      },
    },
    [componentName('responses', singular, { prefix: 'New' })]: {
      description: `${singular} object`,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              doc: {
                allOf: [
                  composeRef('schemas', singular),
                  {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      createdAt: {
                        type: 'string',
                        format: 'date-time',
                      },
                      updatedAt: {
                        type: 'string',
                        format: 'date-time',
                      },
                    },
                    required: ['id', 'createdAt', 'updatedAt'],
                  },
                ],
              },
            },
            required: ['message', 'doc'],
          },
        },
      },
    },
    [componentName('responses', singular, { suffix: 'NotFound' })]: {
      description: `${singular} not found`,
    },
    [componentName('responses', singular, { suffix: 'List' })]: {
      description: `List of ${plural}`,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              docs: {
                type: 'array',
                items: composeRef('schemas', singular),
              },
              totalDocs: { type: 'integer' },
              limit: { type: 'integer' },
              totalPages: { type: 'integer' },
              page: { type: 'integer' },
              pagingCounter: { type: 'integer' },
              hasPrevPage: { type: 'boolean' },
              hasNextPage: { type: 'boolean' },
              prevPage: { type: ['integer', 'null'] },
              nextPage: { type: ['integer', 'null'] },
            },
            required: [
              'docs',
              'totalDocs',
              'limit',
              'totalPages',
              'page',
              'pagingCounter',
              'hasPrevPage',
              'hasNextPage',
              'prevPage',
              'nextPage',
            ],
          } as OpenAPIV3_1.NonArraySchemaObject as any,
        },
      },
    },
  }
}

const isOpenToPublic = async (checker: Access): Promise<boolean> => {
  try {
    const result = await checker(
      new Proxy({} as unknown as AccessArgs, {
        get(target, p, receiver) {
          if (p === 'req') {
            throw new Error()
          }
          return Reflect.get(target, p, receiver)
        },
      }),
    )
    return result === true
  } catch {
    return false
  }
}

const generateCollectionOperations = async (
  collection: Collection,
): Promise<Record<string, OpenAPIV3.PathItemObject & OpenAPIV3_1.PathItemObject>> => {
  const { slug } = collection.config
  const { singular, plural } = collectionName(collection)
  const tags = [plural]

  const singleObjectResponses = {
    200: composeRef('responses', singular),
    404: composeRef('responses', singular, { suffix: 'NotFound' }),
  } satisfies OpenAPIV3_1.ResponsesObject & OpenAPIV3.ResponsesObject

  return {
    [`/api/${slug}`]: {
      get: {
        summary: `Retrieve a list of ${plural}`,
        tags,
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'number' } },
          { in: 'query', name: 'limit', schema: { type: 'number' } },
          ...baseQueryParams,
          {
            in: 'query',
            name: 'sort',
            schema: {
              type: 'string',
              enum: collection.config.fields.flatMap(field => {
                if (
                  field.type === 'number' ||
                  field.type === 'text' ||
                  field.type === 'email' ||
                  field.type === 'date'
                ) {
                  return [field.name, `-${field.name}`]
                }
                return []
              }),
            },
          },
          {
            in: 'query',
            name: 'where',
            style: 'deepObject',
            schema: {
              allOf: [
                { type: 'object' },
                {
                  anyOf: [
                    composeRef('schemas', singular, { suffix: 'QueryOperations' }),
                    composeRef('schemas', singular, { suffix: 'QueryOperationsAnd' }),
                    composeRef('schemas', singular, { suffix: 'QueryOperationsOr' }),
                  ],
                },
              ],
            },
          },
        ],
        responses: {
          200: composeRef('responses', singular, { suffix: 'List' }),
        },
        security: (await isOpenToPublic(collection.config.access.read)) ? [] : [apiKeySecurity],
      },
      post: {
        summary: `Create a new ${singular}`,
        tags,
        requestBody: composeRef('requestBodies', singular),
        responses: {
          201: composeRef('responses', singular, { prefix: 'New' }),
        },
        security: (await isOpenToPublic(collection.config.access.create)) ? [] : [apiKeySecurity],
      },
    },
    [`/api/${slug}/{id}`]: {
      parameters: [
        ...baseQueryParams,
        {
          in: 'path',
          name: 'id',
          description: `ID of the ${singular}`,
          required: true,
          schema: {
            type: 'string',
          },
        },
      ],
      get: {
        summary: `Find a ${singular} by ID`,
        tags,
        responses: singleObjectResponses,
        security: (await isOpenToPublic(collection.config.access.read)) ? [] : [apiKeySecurity],
      },
      patch: {
        summary: `Update a ${singular}`,
        tags,
        responses: singleObjectResponses,
        security: (await isOpenToPublic(collection.config.access.update)) ? [] : [apiKeySecurity],
      },
      delete: {
        summary: `Delete a ${singular}`,
        tags,
        responses: singleObjectResponses,
        security: (await isOpenToPublic(collection.config.access.delete)) ? [] : [apiKeySecurity],
      },
    },
  }
}

const generateGlobalResponse = (
  global: SanitizedGlobalConfig,
): OpenAPIV3_1.ResponseObject & OpenAPIV3.ResponseObject => {
  const name = globalName(global)

  return {
    description: name,
    content: {
      'application/json': {
        schema: composeRef('schemas', name, { suffix: 'Read' }),
      },
    },
  }
}

const generateGlobalRequestBody = (
  global: SanitizedGlobalConfig,
): OpenAPIV3_1.RequestBodyObject & OpenAPIV3.RequestBodyObject => {
  const name = globalName(global)

  return {
    description: name,
    content: {
      'application/json': {
        schema: composeRef('schemas', name, { suffix: 'Write' }),
      },
    },
  }
}

const generateGlobalSchemas = (
  config: SanitizedConfig,
  global: SanitizedGlobalConfig,
): Record<string, JSONSchema4> => {
  const schema = entityToJSONSchema(
    config,
    removeInterfaceNames(global),
    new Map(),
    'text',
    undefined,
  )

  return {
    [componentName('schemas', globalName(global))]: { ...schema, title: globalName(global) },
    [componentName('schemas', globalName(global), { suffix: 'Read' })]: {
      title: `${globalName(global)} (if present)`,
      oneOf: [schema, { type: 'object', properties: {} }],
    },
    [componentName('schemas', globalName(global), { suffix: 'Write' })]: {
      ...requestBodySchema(global.fields, schema),
      title: `${globalName(global)} (writable fields)`,
    },
  }
}

const generateGlobalOperations = async (
  global: SanitizedGlobalConfig,
): Promise<Record<string, OpenAPIV3.PathItemObject & OpenAPIV3_1.PathItemObject>> => {
  const slug = global.slug
  const singular = globalName(global)
  const tags = [singular]

  return {
    [`/api/globals/${slug}`]: {
      get: {
        summary: `Get the ${singular}`,
        tags,
        parameters: [...baseQueryParams],
        responses: { 200: composeRef('responses', singular) },
        security: (await isOpenToPublic(global.access.read)) ? [] : [apiKeySecurity],
      },
      post: {
        summary: `Update the ${singular}`,
        tags,
        requestBody: composeRef('requestBodies', singular),
        responses: { 200: composeRef('responses', singular) },
        security: (await isOpenToPublic(global.access.update)) ? [] : [apiKeySecurity],
      },
    },
  }
}

const generateComponents = (req: Pick<PayloadRequest, 'payload'>) => {
  const schemas: Record<string, JSONSchema4> = {
    supportedTimezones: {
      type: 'string',
      example: 'Europe/Prague',
    },
  }

  for (const collection of Object.values(req.payload.collections)) {
    const { singular } = collectionName(collection)
    schemas[componentName('schemas', singular)] = generateSchemaObject(
      req.payload.config,
      collection,
    )
  }

  for (const collection of Object.values(req.payload.collections)) {
    Object.assign(schemas, generateQueryOperationSchemas(collection))
  }

  for (const global of req.payload.globals.config) {
    Object.assign(schemas, generateGlobalSchemas(req.payload.config, global))
  }

  const requestBodies: Record<string, OpenAPIV3_1.RequestBodyObject> = {}

  for (const collection of Object.values(req.payload.collections)) {
    const { singular } = collectionName(collection)
    requestBodies[componentName('requestBodies', singular)] = generateRequestBodySchema(
      req.payload.config,
      collection,
    )
  }

  for (const global of req.payload.globals.config) {
    requestBodies[componentName('requestBodies', globalName(global))] =
      generateGlobalRequestBody(global)
  }

  const responses: Record<string, OpenAPIV3_1.ResponseObject> = Object.assign(
    {},
    ...Object.values(req.payload.collections).map(generateCollectionResponses),
    ...req.payload.globals.config.map(global => ({
      [componentName('responses', globalName(global))]: generateGlobalResponse(global),
    })),
  )

  return { schemas, requestBodies, responses }
}

export const generateV30Spec = async (
  req: Pick<PayloadRequest, 'payload' | 'protocol' | 'headers'>,
  options: SanitizedPluginOptions,
): Promise<OpenAPIV3.Document> => {
  const { schemas, requestBodies, responses } = generateComponents(req)

  const spec = {
    openapi: '3.0.3',
    info: options.metadata,
    servers: [{ url: `${req.protocol}//${req.headers.get('host')}` }],
    paths: Object.assign(
      {},
      ...(await Promise.all(
        Object.values(req.payload.collections).map(generateCollectionOperations),
      )),
      ...(await Promise.all(req.payload.globals.config.map(generateGlobalOperations))),
    ),
    components: {
      securitySchemes: generateSecuritySchemes(options.authEndpoint),
      schemas: await mapValuesAsync(jsonSchemaToOpenapiSchema, schemas),
      requestBodies: await mapValuesAsync(
        async requestBody => ({
          ...requestBody,
          content: (await mapValuesAsync(
            async contentItem => ({
              ...contentItem,
              schema: contentItem.schema
                ? await jsonSchemaToOpenapiSchema(contentItem.schema as JSONSchema4)
                : undefined,
            }),
            requestBody.content,
          )) as Record<string, OpenAPIV3.MediaTypeObject>,
        }),
        requestBodies,
      ),
      responses: await mapValuesAsync(async response => {
        return {
          ...response,
          content:
            response.content !== undefined
              ? ((await mapValuesAsync(
                  async contentItem => ({
                    ...contentItem,
                    schema: contentItem.schema
                      ? await jsonSchemaToOpenapiSchema(contentItem.schema as JSONSchema4)
                      : undefined,
                  }),
                  response.content,
                )) as Record<string, OpenAPIV3.MediaTypeObject>)
              : {},
        }
      }, responses),
    },
  } satisfies OpenAPIV3.Document

  adjustRefTargets(req.payload, spec)

  return spec
}

export const generateV31Spec = async (
  req: Pick<PayloadRequest, 'payload' | 'protocol' | 'headers'>,
  options: SanitizedPluginOptions,
): Promise<OpenAPIV3_1.Document> => {
  const { schemas, requestBodies, responses } = generateComponents(req)

  const spec = {
    openapi: '3.1.0',
    info: options.metadata,
    servers: [{ url: `${req.protocol}//${req.headers.get('host')}` }],
    paths: Object.assign(
      {},
      ...(await Promise.all(
        Object.values(req.payload.collections).map(generateCollectionOperations),
      )),
      ...(await Promise.all(req.payload.globals.config.map(generateGlobalOperations))),
    ),
    components: {
      securitySchemes: generateSecuritySchemes(options.authEndpoint),
      schemas: schemas as Record<string, OpenAPIV3_1.SchemaObject>,
      requestBodies,
      responses,
    },
  } satisfies OpenAPIV3_1.Document

  adjustRefTargets(req.payload, spec)

  return spec
}
