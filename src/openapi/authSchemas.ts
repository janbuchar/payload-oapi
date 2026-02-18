import type { JSONSchema4 } from 'json-schema'
import type { OpenAPIV3_1 } from 'openapi-types'

export const forgotPasswordRequestBodySchema: OpenAPIV3_1.SchemaObject = {
  title: 'Forgot password request',
  properties: {
    email: {
      type: 'string',
    },
  },
  required: ['email'],
}

export const forgotPasswordResponseSchema: JSONSchema4 = {
  title: 'Forgot password response',
  properties: {
    message: {
      type: 'string',
    },
  },
  required: ['message'],
}

export const loginRequestBodySchema: OpenAPIV3_1.SchemaObject = {
  title: 'Login request',
  properties: {
    email: {
      type: 'string',
    },
    password: {
      type: 'string',
    },
  },
  required: ['email', 'password'],
}

export const loginResponseSchema: JSONSchema4 = {
  title: 'Login response',
  properties: {
    message: {
      type: 'string',
    },
    user: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
        },
        email: {
          type: 'string',
        },
        _verified: {
          type: 'boolean',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
        },
      },
      required: ['id', 'email', '_verified', 'createdAt', 'updatedAt'],
    },
    token: {
      type: 'string',
    },
    exp: {
      type: 'number',
    },
  },
  required: ['message', 'user', 'token', 'exp'],
}

export const logoutResponseSchema: JSONSchema4 = {
  title: 'Logout response',
  properties: {
    message: {
      type: 'string',
    },
  },
  required: ['message'],
}

export const meResponseSchema: JSONSchema4 = {
  title: 'Me response',
  properties: {
    user: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
        },
        email: {
          type: 'string',
        },
        _verified: {
          type: 'boolean',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
        },
        _strategy: {
          type: 'string',
        },
      },
      required: ['id', 'email', '_verified', 'createdAt', 'updatedAt', '_strategy'],
    },
    collection: {
      type: 'string',
    },
    token: {
      type: 'string',
    },
    exp: {
      type: 'number',
    },
  },
  required: ['user', 'collection', 'token', 'exp'],
}

export const refreshTokenResponseSchema: JSONSchema4 = {
  title: 'Refresh token response',
  properties: {
    message: {
      type: 'string',
    },
    user: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
        },
        email: {
          type: 'string',
        },
        collection: {
          type: 'string',
        },
      },
      required: ['id', 'email', 'collection'],
    },
    refreshedToken: {
      type: 'string',
    },
    exp: {
      type: 'number',
    },
  },
  required: ['message', 'user', 'refreshedToken', 'exp'],
}

export const resetPasswordRequestBodySchema: OpenAPIV3_1.SchemaObject = {
  title: 'Reset password request',
  properties: {
    token: {
      type: 'string',
    },
    password: {
      type: 'string',
    },
  },
  required: ['token', 'password'],
}

export const resetPasswordResponseSchema: JSONSchema4 = {
  title: 'Reset password response',
  properties: {
    message: {
      type: 'string',
    },
    token: {
      type: 'string',
    },
    user: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
        },
        email: {
          type: 'string',
        },
        _verified: {
          type: 'boolean',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
        },
      },
      required: ['id', 'email', '_verified', 'createdAt', 'updatedAt'],
    },
  },
  required: ['message', 'token', 'user'],
}

export const unlockRequestBodySchema: OpenAPIV3_1.SchemaObject = {
  title: 'Unlock request',
  properties: {
    email: {
      type: 'string',
    },
  },
  required: ['email'],
}

export const unlockResponseSchema: JSONSchema4 = {
  title: 'Unlock response',
  properties: {
    message: {
      type: 'string',
    },
  },
  required: ['message'],
}

export const verifyUserResponseSchema: JSONSchema4 = {
  title: 'Verify user response',
  properties: {
    message: {
      type: 'string',
    },
  },
  required: ['message'],
}
