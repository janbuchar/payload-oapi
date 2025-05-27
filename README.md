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

# Usage

Unless you configured it otherwise, your spec will be accessible via <https://your-payload.com/api/openapi.json>. If you
added a documentation UI, that will be accessible via <https://your-payload.com/api/docs> (this is also configurable).
