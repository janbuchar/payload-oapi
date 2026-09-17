# Payload OpenAPI Plugin

[![npm version](https://badge.fury.io/js/payload-oapi.svg)](https://www.npmjs.com/package/payload-oapi)

Autogenerate an OpenAPI specification from your Payload CMS instance and use it for documentation or to generate client SDKs.

# Roadmap

- [x] Complete description of collection CRUD endpoints
- [x] Complete description of globals CRUD endpoints
- [x] Integrated Swagger UI and Rapidoc
- [x] Authentication endpoints and specification
- [x] Preferences endpoints
- [x] Support Payload CMS 3.x
- [x] Support generating both OpenAPI 3.0 and 3.1
- [x] Collection and global filtering
- [x] Custom endpoints

# Installation

You can install the plugin using your preferred package manager:

- `pnpm add payload-oapi`
- `npm install payload-oapi`
- `yarn add payload-oapi`

# Setup

## 1. Add the OpenAPI core plugin

To add the OpenAPI specification endpoint to your Payload app, simply import the `openapi` plugin and add it to your payload configuration:

```typescript
import { openapi } from 'payload-oapi'

buildConfig({
  plugins: [
    openapi({ openapiVersion: '3.0', metadata: { title: 'Dev API', version: '0.0.1' } }),
  ],
  // ...
})
```

## 2. Add a documentation UI plugin (optional)

To provide a user interface for your API documentation, you can add one of the following plugins:

- [`scalar`](https://github.com/scalar/scalar)
- [`swaggerUI`](https://swagger.io/tools/swagger-ui/)
- [`rapidoc`](https://mrin9.github.io/RapiDoc/)
- [`redoc`](https://github.com/Redocly/redoc)

Example usage:

```typescript
import { openapi, scalar, swaggerUI, rapidoc, redoc } from 'payload-oapi'

// Choose one documentation UI plugins as needed
buildConfig({
  plugins: [
    openapi(/* ... */),
    // Uncomment the UI you want to use:
    scalar({ /* ...options */ }),
    // swaggerUI({ /* ...options */ }),
    // rapidoc({ /* ...options */ }),
    // redoc({ /* ...options */ }),
  ],
  // ...
})
```

## 3. Filter collections and globals (optional)

Control which collections and globals appear in the OpenAPI spec using the `filters` option:

- `includeCollections` / `excludeCollections` — filter collections by slug
- `includeGlobals` / `excludeGlobals` — filter globals by slug
- `hideInternalCollections` — exclude `payload-*` collections

Example:

```typescript
openapi({
  openapiVersion: '3.0',
  metadata: { title: 'Dev API', version: '0.0.1' },
  filters: {
    includeCollections: ['posts', 'categories'],
    excludeGlobals: ['footer'],
    hideInternalCollections: true,
  },
})
```

## 4. Override the API base path (optional)

Generated operation paths are prefixed with your Payload `routes.api` setting. Set `apiBasePath` if clients reach the
API under a different prefix, e.g. behind a reverse proxy:

```typescript
openapi({
  openapiVersion: '3.0',
  metadata: { title: 'Dev API', version: '0.0.1' },
  apiBasePath: '/public-api',
})
```

## 5. Document your own endpoints (optional)

Payload `endpoints` — on a collection, a global or the config root — are documented when they carry an OpenAPI
operation under `custom.openapi`. Anything you do not set is filled in for you (`tags`, `operationId`, `summary`, and a
`security` requirement, since the generator cannot inspect a custom handler's access control):

```typescript
import type { CustomEndpointDocumentation } from 'payload-oapi'

const Pets: CollectionConfig = {
  slug: 'pets',
  endpoints: [
    {
      path: '/by-status/:status',
      method: 'get',
      handler: myHandler,
      custom: {
        openapi: {
          summary: 'List pets by status',
          security: [],
          parameters: [{ in: 'path', name: 'status', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Pets with the requested status',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Pet' } },
                },
              },
            },
          },
        } satisfies CustomEndpointDocumentation,
      },
    },
  ],
  // ...
}
```

Write these in OpenAPI 3.1 syntax whatever `openapiVersion` you configured — a 3.0 spec is down-converted on the way
out. `$ref` pointers to generated components work as shown; to add schemas of your own, declare them through Payload's
`typescript.schema` and reference them the same way.

# Auth endpoints

Collections with `auth` get their login, logout, refresh, verification and password-reset operations documented
automatically, following that collection's auth config — `disableLocalStrategy` drops the password operations,
`loginWithUsername` decides whether the login body takes an email or a username, `maxLoginAttempts: 0` drops
`/unlock`, and `verify` adds `/verify/{id}`.

# Usage

Unless you configured it otherwise, your spec will be accessible via <https://your-payload.com/api/openapi.json>. If you
added a documentation UI, that will be accessible via <https://your-payload.com/api/docs> (this is also configurable).
