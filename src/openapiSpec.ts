import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import type { PayloadRequest } from 'payload/dist/express/types'
import type { JSONSchema4 } from 'json-schema'
import type { OpenAPIMetadata } from './types'
import type { FieldBase, RadioField, SelectField } from 'payload/dist/fields/config/types'
import type { SanitizedConfig } from 'payload/config'
import type { Collection } from 'payload/dist/collections/config/types'
import type { i18n as Ii18n } from 'i18next'

import jsonSchemaToOpenapiSchema from '@openapi-contrib/json-schema-to-openapi-schema'
import { getTranslation } from 'payload/dist/utilities/getTranslation'
import { entityToJSONSchema } from 'payload/utilities'

const adjustRefTargets = (subject: Record<string, unknown>): void => {
  const search = new RegExp('^#/definitions/')

  for (const [key, value] of Object.entries(subject)) {
    if (key === '$ref' && typeof value === 'string') {
      subject[key] = value.replace(search, '#/components/schemas/')
    }

    if (typeof value === 'object' && value !== null && value !== null) {
      adjustRefTargets(value as Record<string, unknown>)
    }
  }
}

const mapValues = <T, U>(mapper: (value: T) => U, record: Record<string, T>): Record<string, U> =>
  Object.fromEntries(Object.entries(record).map(([key, value]) => [key, mapper(value)]))

const mapValuesAsync = async <T, U>(
  mapper: (value: T) => Promise<U>,
  record: Record<string, T>,
): Promise<Record<string, U>> =>
  Object.fromEntries(
    await Promise.all(
      Object.entries(record).map(async ([key, value]) => [key, await mapper(value)]),
    ),
  )

const generateSchemaObject = (
  config: SanitizedConfig,
  collection: Collection,
  i18n: Ii18n,
): JSONSchema4 => {
  const schema = entityToJSONSchema(config, collection.config)
  return {
    ...schema,
    title: getTranslation(collection.config.labels.singular, i18n),
  }
}

const generateRequestBodySchema = (
  config: SanitizedConfig,
  collection: Collection,
  i18n: Ii18n,
): OpenAPIV3_1.RequestBodyObject => {
  const schema = entityToJSONSchema(config, collection.config)
  return {
    description: getTranslation(collection.config.labels.singular, i18n),
    content: {
      'text/json': {
        schema: {
          ...schema,
          properties: Object.fromEntries(
            Object.entries(schema.properties ?? {}).filter(
              ([slug]) => !['id', 'createdAt', 'updatedAt'].includes(slug),
            ),
          ),
        } as OpenAPIV3_1.SchemaObject,
      },
    },
  }
}

const generateQueryOperationSchemas = (
  collection: Collection,
  i18n: Ii18n,
): Record<string, JSONSchema4> => {
  const slug = collection.config.slug
  const singular = getTranslation(collection.config.labels.singular, i18n)

  return {
    [`${slug}QueryOperations`]: {
      title: `${singular} query operations`,
      type: 'object',
      properties: Object.fromEntries(
        (
          collection.config.fields.filter(({ type }) =>
            ['number', 'text', 'email', 'date', 'radio', 'select'].includes(type),
          ) as Array<
            FieldBase & { type: 'number' | 'text' | 'email' | 'date' | 'radio' | 'select' }
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
    [`${slug}QueryOperationsAnd`]: {
      title: `${singular} query conjunction`,
      type: 'object',
      properties: {
        and: {
          type: 'array',
          items: {
            anyOf: [
              { $ref: `#/components/schemas/${slug}QueryOperations` },
              { $ref: `#/components/schemas/${slug}QueryOperationsAnd` },
              { $ref: `#/components/schemas/${slug}QueryOperationsOr` },
            ],
          },
        },
      },
      required: ['and'],
    },

    [`${slug}QueryOperationsOr`]: {
      title: `${singular} query disjunction`,
      type: 'object',
      properties: {
        or: {
          type: 'array',
          items: {
            anyOf: [
              { $ref: `#/components/schemas/${slug}QueryOperations` },
              { $ref: `#/components/schemas/${slug}QueryOperationsAnd` },
              { $ref: `#/components/schemas/${slug}QueryOperationsOr` },
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
  i18n: Ii18n,
): Record<string, OpenAPIV3_1.ResponseObject & OpenAPIV3.ResponseObject> => {
  const singular = getTranslation(collection.config.labels.singular, i18n)
  const plural = getTranslation(collection.config.labels.plural, i18n)
  const slug = collection.config.slug

  return {
    [`${slug}Response`]: {
      description: `${singular} object`,
      content: {
        'text/json': {
          schema: { $ref: `#/components/schemas/${slug}` },
        },
      },
    },
    [`New${slug}Response`]: {
      description: `${singular} object`,
      content: {
        'text/json': {
          schema: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              doc: {
                allOf: [
                  { $ref: `#/components/schemas/${slug}` },
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
    [`${slug}NotFoundResponse`]: {
      description: `${singular} not found`,
    },
    [`${slug}ListResponse`]: {
      description: `List of ${plural}`,
      content: {
        'text/json': {
          schema: {
            type: 'object',
            properties: {
              docs: {
                type: 'array',
                items: { $ref: `#/components/schemas/${slug}` },
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

export const generateCollectionOperations = (
  collection: Collection,
  i18n: Ii18n,
): Record<string, OpenAPIV3.PathItemObject & OpenAPIV3_1.PathItemObject> => {
  const slug = collection.config.slug
  const singular = getTranslation(collection.config.labels.singular, i18n)
  const plural = getTranslation(collection.config.labels.plural, i18n)
  const tags = [plural]

  const singleObjectResponses = {
    200: {
      $ref: `#/components/responses/${slug}Response`,
    },
    404: {
      $ref: `#/components/responses/${slug}NotFoundResponse`,
    },
  } satisfies OpenAPIV3_1.ResponsesObject & OpenAPIV3.ResponsesObject

  return {
    [`/api/${slug}`]: {
      get: {
        summary: `Retrieve a list of ${plural}`,
        tags,
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'number' } },
          { in: 'query', name: 'limit', schema: { type: 'number' } },
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
                    { $ref: `#/components/schemas/${slug}QueryOperations` },
                    { $ref: `#/components/schemas/${slug}QueryOperationsAnd` },
                    { $ref: `#/components/schemas/${slug}QueryOperationsOr` },
                  ],
                },
              ],
            },
          },
        ],
        responses: {
          200: { $ref: `#/components/responses/${slug}ListResponse` },
        },
      },
      post: {
        summary: `Create a new ${singular}`,
        tags,
        requestBody: { $ref: `#/components/requestBodies/${slug}` },
        responses: {
          201: { $ref: `#/components/responses/New${slug}Response` },
        },
      },
    },
    [`/api/${slug}/{id}`]: {
      parameters: [
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
      },
      patch: {
        summary: `Update a ${singular}`,
        tags,
        responses: singleObjectResponses,
      },
      delete: {
        summary: `Delete a ${singular}`,
        tags,
        responses: singleObjectResponses,
      },
    },
  }
}

export const generateV30Spec = async (
  req: PayloadRequest,
  metadata: OpenAPIMetadata,
): Promise<OpenAPIV3.Document> => {
  const schemas: Record<string, JSONSchema4> = Object.assign(
    {},
    mapValues(
      collection => generateSchemaObject(req.payload.config, collection, req.i18n),
      req.payload.collections,
    ),
    ...Object.values(req.payload.collections).map(collection =>
      generateQueryOperationSchemas(collection, req.i18n),
    ),
  )

  const requestBodies = Object.assign(
    {},
    mapValues(
      collection => generateRequestBodySchema(req.payload.config, collection, req.i18n),
      req.payload.collections,
    ),
  )

  const responses: Record<string, OpenAPIV3_1.ResponseObject> = Object.assign(
    {},
    ...Object.values(req.payload.collections).map(collection =>
      generateCollectionResponses(collection, req.i18n),
    ),
  )

  const spec = {
    openapi: '3.0.3',
    info: metadata,
    paths: Object.assign(
      {},
      ...Object.values(req.payload.collections).map(collection =>
        generateCollectionOperations(collection, req.i18n),
      ),
    ),
    components: {
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

  adjustRefTargets(spec)

  return spec
}

export const generateV31Spec = async (
  req: PayloadRequest,
  metadata: OpenAPIMetadata,
): Promise<OpenAPIV3_1.Document> => {
  const spec = {
    openapi: '3.1.0',
    info: metadata,
    paths: Object.assign(
      {},
      ...Object.values(req.payload.collections).map(collection =>
        generateCollectionOperations(collection, req.i18n),
      ),
    ),
    components: {
      schemas: Object.assign(
        {},
        mapValues(
          collection =>
            generateSchemaObject(
              req.payload.config,
              collection,
              req.i18n,
            ) as OpenAPIV3_1.SchemaObject,
          req.payload.collections,
        ),
        ...Object.values(req.payload.collections).map(collection =>
          generateQueryOperationSchemas(collection, req.i18n),
        ),
      ),
      requestBodies: Object.assign(
        {},
        mapValues(
          collection =>
            generateRequestBodySchema(
              req.payload.config,
              collection,
              req.i18n,
            ) as OpenAPIV3_1.RequestBodyObject,
          req.payload.collections,
        ),
      ),
      responses: Object.assign(
        {},
        ...Object.values(req.payload.collections).map(collection =>
          generateCollectionResponses(collection, req.i18n),
        ),
      ),
    },
  } satisfies OpenAPIV3_1.Document

  adjustRefTargets(spec)

  return spec
}
