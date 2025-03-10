import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

export const apiKeySecurity = { ApiKey: [] }

export const generateSecuritySchemes = (
  tokenUrl: string,
): Record<string, OpenAPIV3.SecuritySchemeObject & OpenAPIV3_1.SecuritySchemeObject> => ({
  ApiKey: {
    type: 'oauth2',
    flows: {
      password: {
        tokenUrl: `/api/${tokenUrl}`,
        scopes: {},
      },
    },
  },
})
