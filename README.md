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
- [x] Collection and Global filtering options
- [ ] Custom endpoints

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
    openapi({ 
      openapiVersion: '3.0', 
      metadata: { title: 'Dev API', version: '0.0.1' } 
    }),
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

## 3. Filtering Collections and Globals (optional)

You can control which collections and globals are included in the OpenAPI specification using filtering options:

### Include/Exclude by slug

```typescript
import { openapi } from 'payload-oapi'

buildConfig({
  plugins: [
    openapi({
      openapiVersion: '3.0',
      metadata: { title: 'Dev API', version: '0.0.1' },
      // Only include specific collections
      includeCollections: ['posts', 'users'],
      // Exclude specific globals
      excludeGlobals: ['internal-settings'],
    }),
  ],
  // ...
})
```

### Custom filtering functions

```typescript
import { openapi } from 'payload-oapi'

buildConfig({
  plugins: [
    openapi({
      openapiVersion: '3.0',
      metadata: { title: 'Dev API', version: '0.0.1' },
      // Include collections based on custom logic
      includeCollections: ({ slug, config }) => {
        // Only include collections that have auth enabled or are public
        return config.auth || config.access?.read === true
      },
      // Exclude globals based on custom logic
      excludeGlobals: ({ slug }) => {
        // Exclude any globals that start with 'internal-'
        return slug.startsWith('internal-')
      },
    }),
  ],
  // ...
})
```

### Filtering Options

- `includeCollections`: Array of collection slugs or a filter function. If specified, only these collections will be included.
- `excludeCollections`: Array of collection slugs or a filter function. These collections will be excluded.
- `includeGlobals`: Array of global slugs or a filter function. If specified, only these globals will be included.
- `excludeGlobals`: Array of global slugs or a filter function. These globals will be excluded.

**Note**: Include filters are applied first, then exclude filters. If both are specified, a collection/global must pass both filters to be included.

# Usage

By default, the following endpoints are available:

- OpenAPI Specification: `https://your-payload.com/api/openapi.json`
- Documentation UI: `https://your-payload.com/api/docs` (only if you enabled the doc plugin)