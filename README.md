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
- [x] Operation-level filtering (CRUD operations)
- [x] Field-level filtering
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

## 3. Filtering and Control Options

### Collection and Global Filtering

Control which collections and globals are included in the OpenAPI specification:

```typescript
import { openapi } from 'payload-oapi'

// Basic filtering with arrays
buildConfig({
  plugins: [
    openapi({
      openapiVersion: '3.0',
      metadata: { title: 'Public API', version: '1.0.0' },
      
      // Include only specific collections
      includeCollections: ['posts', 'categories'],
      
      // Exclude sensitive globals
      excludeGlobals: ['internal-settings'],
      
      // Hide internal Payload collections (payload-preferences, payload-migrations)
      hideInternalCollections: true,
    }),
  ],
})

// Advanced filtering with functions
buildConfig({
  plugins: [
    openapi({
      openapiVersion: '3.0',
      metadata: { title: 'Public API', version: '1.0.0' },
      
      // Custom filtering with functions
      includeCollections: ({ slug, config }) => {
        return config.auth || config.access?.read === true
      },
      
      excludeGlobals: ({ slug, config }) => {
        return slug.startsWith('internal-')
      },
    }),
  ],
})
```

### Operation-Level Filtering

Control which CRUD operations are included for collections:

```typescript
import { openapi } from 'payload-oapi'

// Include only specific operations
buildConfig({
  plugins: [
    openapi({
      openapiVersion: '3.0',
      metadata: { title: 'Read-Only API', version: '1.0.0' },
      
      operations: {
        includeOperations: ['read', 'list'],
      },
    }),
  ],
})

// Exclude dangerous operations
buildConfig({
  plugins: [
    openapi({
      openapiVersion: '3.0',
      metadata: { title: 'Safe API', version: '1.0.0' },
      
      operations: {
        excludeOperations: ['delete'],
      },
    }),
  ],
})

// Custom operation filtering per collection
buildConfig({
  plugins: [
    openapi({
      openapiVersion: '3.0',
      metadata: { title: 'Custom API', version: '1.0.0' },
      
      operations: {
        operationFilter: (operation, collection) => {
          // Only allow read operations for sensitive collections
          if (collection.slug === 'users') {
            return ['read', 'list'].includes(operation)
          }
          // Allow all operations for other collections
          return true
        }
      },
    }),
  ],
})
```

### Field-Level Filtering

Control which fields are exposed in the documentation:

```typescript
import { openapi } from 'payload-oapi'

// Exclude specific fields by name
buildConfig({
  plugins: [
    openapi({
      openapiVersion: '3.0',
      metadata: { title: 'Clean API', version: '1.0.0' },
      
      excludeFields: ['internalNotes', 'adminComments'],
    }),
  ],
})

// Custom field filtering by type and name
buildConfig({
  plugins: [
    openapi({
      openapiVersion: '3.0',
      metadata: { title: 'Secure API', version: '1.0.0' },
      
      excludeFields: ({ name, type }) => {
        // Exclude all password-type fields and internal fields
        return type === 'password' || name.startsWith('_')
      },
    }),
  ],
})

// Advanced field filtering with collection context
buildConfig({
  plugins: [
    openapi({
      openapiVersion: '3.0',
      metadata: { title: 'Context-Aware API', version: '1.0.0' },
      
      excludeFields: ({ name, type, collection }) => {
        // Different filtering rules for different collections
        if (collection.slug === 'users') {
          // For users, exclude sensitive fields
          return ['password', 'salt', 'hash', 'resetPasswordToken'].includes(name)
        }
        
        if (collection.slug === 'posts') {
          // For posts, exclude internal fields and drafts
          return name.startsWith('_') || name === 'draft'
        }
        
        // For other collections, only exclude password fields
        return type === 'password'
      },
    }),
  ],
})
```

# Configuration Options Reference

### Basic Options
- `enabled?: boolean` - Enable/disable the plugin
- `openapiVersion?: '3.0' | '3.1'` - OpenAPI specification version
- `specEndpoint?: string` - Endpoint for the OpenAPI spec (default: `/openapi.json`)
- `authEndpoint?: string` - Authentication endpoint (default: `/openapi-auth`)
- `metadata: OpenAPIMetadata` - API metadata (title, version, description)

### Filtering Options
- `includeCollections?: string[] | FilterFunction` - Collections to include
- `excludeCollections?: string[] | FilterFunction` - Collections to exclude
- `includeGlobals?: string[] | FilterFunction` - Globals to include
- `excludeGlobals?: string[] | FilterFunction` - Globals to exclude
- `hideInternalCollections?: boolean` - Hide payload-* collections

### Operation Control
- `operations?.includeOperations?: CRUDOperation[]` - Operations to include
- `operations?.excludeOperations?: CRUDOperation[]` - Operations to exclude
- `operations?.operationFilter?: Function` - Custom operation filtering

### Field Control
- `excludeFields?: string[] | FilterFunction` - Fields to exclude

**Note**: Filters are applied in order: include → exclude. Custom functions take precedence over arrays.

# Usage

By default, the following endpoints are available:

- OpenAPI Specification: `https://your-payload.com/api/openapi.json`
- Documentation UI: `https://your-payload.com/api/docs` (only if you enabled the doc plugin)