import type { JSONSchema4 } from 'json-schema'
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import type { Auth, Collection } from 'payload'

import { collectionName, componentName, composeRef } from './naming.js'
import { apiKeySecurity } from './securitySchemes.js'

/**
 * Payload registers `authCollectionEndpoints` for every auth-enabled collection and
 * `authRootEndpoints` once, but several of them only work under a particular auth config - a
 * documented endpoint that always 403s is worse than an absent one. Shapes here mirror
 * `payload/dist/auth/endpoints/*` and the operation result types they spread.
 */

const stringSchema: JSONSchema4 = { type: 'string' }

/** Every auth handler wraps its result in a localized `message`. */
const messageSchema: JSONSchema4 = {
  type: 'object',
  additionalProperties: false,
  properties: { message: stringSchema },
  required: ['message'],
}

const initSchema: JSONSchema4 = {
  type: 'object',
  additionalProperties: false,
  properties: { initialized: { type: 'boolean' } },
  required: ['initialized'],
}

/**
 * `accessOperation` returns a permission tree keyed by collection and global slug, with a shape
 * driven by every access function in the config. Enumerating it here would be a contract the API
 * cannot honor once a single access control changes.
 */
const accessSchema: JSONSchema4 = {
  type: 'object',
  description: 'Resolved permissions for the authenticated user, keyed by collection and global',
}

/** Auth responses shared by every collection, so the `{ message }` shape is defined once. */
export const sharedAuthSchemas: Record<string, JSONSchema4> = {
  AuthMessage: messageSchema,
  AuthInit: initSchema,
  AuthAccess: accessSchema,
}

export const sharedAuthResponses: Record<
  string,
  OpenAPIV3_1.ResponseObject & OpenAPIV3.ResponseObject
> = {
  [componentName('responses', 'AuthMessage')]: {
    description: 'Operation result message',
    content: { 'application/json': { schema: composeRef('schemas', 'AuthMessage') } },
  },
  [componentName('responses', 'AuthInit')]: {
    description: 'Whether the collection already has at least one document',
    content: { 'application/json': { schema: composeRef('schemas', 'AuthInit') } },
  },
  [componentName('responses', 'AuthAccess')]: {
    description: 'Resolved permissions for the authenticated user',
    content: { 'application/json': { schema: composeRef('schemas', 'AuthAccess') } },
  },
}

interface AuthCapabilities {
  /** Payload's email/password strategy; disabling it leaves only custom strategies and cookies. */
  localStrategy: boolean
  verify: boolean
  lockout: boolean
  /** `removeTokenFromResponses` strips the JWT from login, refresh, me and reset-password. */
  exposesToken: boolean
}

const capabilities = (auth: Auth): AuthCapabilities => ({
  localStrategy: !auth.disableLocalStrategy,
  verify: Boolean(auth.verify),
  lockout: !auth.disableLocalStrategy && auth.maxLoginAttempts > 0,
  exposesToken: !auth.removeTokenFromResponses,
})

/**
 * Which field identifies an account depends on `loginWithUsername`; when both are accepted Payload
 * needs exactly one of them, which `anyOf` states without making either unconditionally required.
 */
const identifierSchema = (auth: Auth): JSONSchema4 => {
  const { loginWithUsername } = auth

  if (loginWithUsername === false) {
    return {
      properties: { email: { type: 'string', format: 'email' } },
      required: ['email'],
    }
  }

  if (loginWithUsername.allowEmailLogin === false) {
    return { properties: { username: stringSchema }, required: ['username'] }
  }

  return {
    properties: { email: { type: 'string', format: 'email' }, username: stringSchema },
    anyOf: [{ required: ['email'] }, { required: ['username'] }],
  }
}

const credentialsSchema = (auth: Auth): JSONSchema4 => {
  const identifier = identifierSchema(auth)

  return {
    ...identifier,
    properties: { ...identifier.properties, password: stringSchema },
    required: [...((identifier.required as string[] | undefined) ?? []), 'password'],
  }
}

const requestBody = (description: string, schema: JSONSchema4): OpenAPIV3_1.RequestBodyObject => ({
  description,
  required: true,
  content: {
    'application/json': {
      schema: { type: 'object', additionalProperties: false, ...schema } as never,
    },
  },
})

/** Response payloads that embed the authenticated document, so they are per collection. */
export const generateAuthSchemas = (collection: Collection): Record<string, JSONSchema4> => {
  const { singular } = collectionName(collection)
  const { exposesToken } = capabilities(collection.config.auth)
  const user = composeRef('schemas', singular) as unknown as JSONSchema4
  const token: Record<string, JSONSchema4> = exposesToken ? { token: stringSchema } : {}
  const refreshedToken: Record<string, JSONSchema4> = exposesToken
    ? { refreshedToken: stringSchema }
    : {}

  return {
    [componentName('schemas', singular, { suffix: 'Login' })]: {
      type: 'object',
      additionalProperties: false,
      properties: { message: stringSchema, user, exp: { type: 'number' }, ...token },
      required: ['message', 'user'],
    },
    [componentName('schemas', singular, { suffix: 'Me' })]: {
      type: 'object',
      additionalProperties: false,
      // Every field of `MeOperationResult` is optional - an unauthenticated request still gets 200.
      properties: {
        message: stringSchema,
        user,
        collection: stringSchema,
        exp: { type: 'number' },
        ...token,
      },
      required: ['message'],
    },
    [componentName('schemas', singular, { suffix: 'RefreshToken' })]: {
      type: 'object',
      additionalProperties: false,
      properties: {
        message: stringSchema,
        user,
        exp: { type: 'number' },
        ...refreshedToken,
      },
      required: ['message', 'user', 'exp'],
    },
    [componentName('schemas', singular, { suffix: 'ResetPassword' })]: {
      type: 'object',
      additionalProperties: false,
      properties: { message: stringSchema, user, ...token },
      required: ['message', 'user'],
    },
  }
}

/**
 * Payload appends `authCollectionEndpoints` under exactly these conditions
 * (`collections/config/sanitize.ts`), so anything else would document routes that are not served.
 */
export const hasAuthEndpoints = (collection: Collection): boolean =>
  Boolean(collection.config.auth) && collection.config.endpoints !== false

export const generateAuthRequestBodies = (
  collection: Collection,
): Record<string, OpenAPIV3_1.RequestBodyObject> => {
  const { auth } = collection.config
  const { singular } = collectionName(collection)
  const { localStrategy, lockout } = capabilities(auth)

  if (!localStrategy) {
    return {}
  }

  return {
    [componentName('requestBodies', singular, { suffix: 'Login' })]: requestBody(
      `Credentials of the ${singular} to log in`,
      credentialsSchema(auth),
    ),
    [componentName('requestBodies', singular, { suffix: 'ForgotPassword' })]: requestBody(
      `Identifier of the ${singular} to send a reset token to`,
      identifierSchema(auth),
    ),
    [componentName('requestBodies', singular, { suffix: 'ResetPassword' })]: requestBody(
      `Reset token and new password for the ${singular}`,
      {
        properties: { token: stringSchema, password: stringSchema },
        required: ['token', 'password'],
      },
    ),
    ...(lockout
      ? {
          [componentName('requestBodies', singular, { suffix: 'Unlock' })]: requestBody(
            `Identifier of the ${singular} to unlock`,
            identifierSchema(auth),
          ),
        }
      : {}),
  }
}

export const generateAuthResponses = (
  collection: Collection,
): Record<string, OpenAPIV3_1.ResponseObject & OpenAPIV3.ResponseObject> => {
  const { singular } = collectionName(collection)

  const referencing = (
    suffix: string,
    description: string,
  ): OpenAPIV3_1.ResponseObject & OpenAPIV3.ResponseObject => ({
    description,
    content: { 'application/json': { schema: composeRef('schemas', singular, { suffix }) } },
  })

  return {
    [componentName('responses', singular, { suffix: 'Login' })]: referencing(
      'Login',
      `The logged in ${singular} and its token`,
    ),
    [componentName('responses', singular, { suffix: 'Me' })]: referencing(
      'Me',
      `The currently authenticated ${singular}, if any`,
    ),
    [componentName('responses', singular, { suffix: 'RefreshToken' })]: referencing(
      'RefreshToken',
      `The ${singular} and its refreshed token`,
    ),
    [componentName('responses', singular, { suffix: 'ResetPassword' })]: referencing(
      'ResetPassword',
      `The ${singular} whose password was reset`,
    ),
  }
}

type Operations = Record<string, OpenAPIV3.PathItemObject & OpenAPIV3_1.PathItemObject>

export const generateAuthOperations = (collection: Collection, apiRoute: string): Operations => {
  const { auth, slug } = collection.config

  const { singular, plural } = collectionName(collection)
  const { localStrategy, verify, lockout } = capabilities(auth)
  const tags = [plural]
  const operationId = (prefix: string) => componentName('schemas', singular, { prefix })
  const message = composeRef('responses', 'AuthMessage')

  const local: Operations = localStrategy
    ? {
        [`${apiRoute}/${slug}/login`]: {
          post: {
            operationId: operationId('login'),
            summary: `Log in as a ${singular}`,
            tags,
            requestBody: composeRef('requestBodies', singular, { suffix: 'Login' }),
            responses: { 200: composeRef('responses', singular, { suffix: 'Login' }) },
            security: [],
          },
        },
        [`${apiRoute}/${slug}/forgot-password`]: {
          post: {
            operationId: operationId('forgotPassword'),
            summary: `Send a password reset token to a ${singular}`,
            tags,
            requestBody: composeRef('requestBodies', singular, { suffix: 'ForgotPassword' }),
            responses: { 200: message },
            security: [],
          },
        },
        [`${apiRoute}/${slug}/reset-password`]: {
          post: {
            operationId: operationId('resetPassword'),
            summary: `Reset the password of a ${singular}`,
            tags,
            requestBody: composeRef('requestBodies', singular, { suffix: 'ResetPassword' }),
            responses: { 200: composeRef('responses', singular, { suffix: 'ResetPassword' }) },
            security: [],
          },
        },
        [`${apiRoute}/${slug}/first-register`]: {
          post: {
            operationId: operationId('firstRegister'),
            summary: `Create the first ${singular}`,
            description: `Only succeeds while no ${plural} exist.`,
            tags,
            requestBody: composeRef('requestBodies', singular),
            responses: { 200: composeRef('responses', singular, { suffix: 'Login' }) },
            security: [],
          },
        },
      }
    : {}

  return {
    ...local,
    ...(lockout
      ? {
          [`${apiRoute}/${slug}/unlock`]: {
            post: {
              operationId: operationId('unlock'),
              summary: `Unlock a locked out ${singular}`,
              tags,
              requestBody: composeRef('requestBodies', singular, { suffix: 'Unlock' }),
              responses: { 200: message },
              security: [apiKeySecurity],
            },
          },
        }
      : {}),
    ...(verify
      ? {
          [`${apiRoute}/${slug}/verify/{id}`]: {
            parameters: [
              {
                in: 'path',
                name: 'id',
                description: `Verification token emailed to the ${singular}`,
                required: true,
                schema: stringSchema as OpenAPIV3.SchemaObject,
              },
            ],
            post: {
              operationId: operationId('verify'),
              summary: `Verify the email address of a ${singular}`,
              tags,
              responses: { 200: message },
              security: [],
            },
          },
        }
      : {}),
    [`${apiRoute}/${slug}/logout`]: {
      post: {
        operationId: operationId('logout'),
        summary: `Log out the current ${singular}`,
        tags,
        responses: { 200: message },
        security: [apiKeySecurity],
      },
    },
    [`${apiRoute}/${slug}/me`]: {
      get: {
        operationId: operationId('me'),
        summary: `Retrieve the currently authenticated ${singular}`,
        tags,
        responses: { 200: composeRef('responses', singular, { suffix: 'Me' }) },
        security: [apiKeySecurity],
      },
    },
    [`${apiRoute}/${slug}/refresh-token`]: {
      post: {
        operationId: operationId('refreshToken'),
        summary: `Refresh the token of the current ${singular}`,
        tags,
        responses: { 200: composeRef('responses', singular, { suffix: 'RefreshToken' }) },
        security: [apiKeySecurity],
      },
    },
    [`${apiRoute}/${slug}/init`]: {
      get: {
        operationId: operationId('init'),
        summary: `Check whether any ${plural} exist`,
        tags,
        responses: { 200: composeRef('responses', 'AuthInit') },
        security: [],
      },
    },
  }
}

/** `authRootEndpoints` is registered once, not per collection. */
export const generateAuthRootOperations = (apiRoute: string): Operations => ({
  [`${apiRoute}/access`]: {
    get: {
      operationId: 'access',
      summary: 'Retrieve the permissions of the authenticated user',
      tags: ['auth'],
      responses: { 200: composeRef('responses', 'AuthAccess') },
      security: [apiKeySecurity],
    },
  },
})
