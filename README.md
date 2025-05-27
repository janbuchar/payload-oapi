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

Install the plugin from npm - `yarn add payload-oapi` or `npm i payload-oapi`.

# Setup

To add the OpenAPI specification endpoint to your Payload app, simply import the `openapi` plugin and add it to your payload configuration:

```typescript
import { openapi } from 'payload-oapi'

buildConfig({
  plugins: [
    openapi({ openapiVersion: '3.0', metadata: { title: 'Dev API', version: '0.0.1' } }),
    // ...
  ],
  // ...
})
```

To add a documentation UI, use the `scalar`, `swaggerUI`, `rapidoc` or `redoc` plugins, respectively:

```typescript
import { openapi, swaggerUI } from 'payload-oapi'

buildConfig({
  plugins: [
    openapi(/* ... */),
    swaggerUI({/* ... */})
  ],
  // ...
})
```

# Usage

Unless you configured it otherwise, your spec will be accessible via <https://your-payload.com/api/openapi.json>. If you
added a documentation UI, that will be accessible via <https://your-payload.com/api/docs> (this is also configurable).
